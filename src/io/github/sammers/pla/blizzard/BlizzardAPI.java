package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Snapshot;
import io.github.sammers.pla.logic.CharUpdater;
import io.github.sammers.pla.logic.CharacterCache;
import io.github.sammers.pla.logic.RateLimiter;
import io.github.sammers.pla.logic.Refs;
import io.reactivex.Completable;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.MultiMap;
import io.vertx.reactivex.ext.web.client.HttpResponse;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static io.github.sammers.pla.logic.Conts.EU;
import static io.github.sammers.pla.logic.Conts.US;

/**
 * Blizzard API.
 */
public class BlizzardAPI {

    public static final String AUTH_URL = "https://oauth.battle.net/token";
    public static String LOCALE = "en_US";
    private static final String CURRENT_PVP_SEASON_ID = "36";
    private static final Logger log = LoggerFactory.getLogger(BlizzardAPI.class);
    private final String clientSecret;
    private final WebClient webClient;
    private final Refs refs;
    private final CharacterCache characterCache;
    private final Map<String, Cutoffs> cutoffs;
    private final String clientId;
    private final AtomicReference<BlizzardAuthToken> token = new AtomicReference<>();
    private final RateLimiter rateLimiter = new RateLimiter(5, Main.VTHREAD_SCHEDULER);

    public BlizzardAPI(String clientId, String clientSecret, WebClient webClient, Refs refs, CharacterCache characterCache, Map<String, Cutoffs> cutoffs) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.webClient = webClient;
        this.refs = refs;
        this.characterCache = characterCache;
        this.cutoffs = cutoffs;
    }

    public Completable rpsToken() {
        return rateLimiter.request();
    }

    public Single<BlizzardAuthToken> token() {
        return Single.defer(() -> {
            final BlizzardAuthToken token = this.token.get();
            final Single<BlizzardAuthToken> res;
            if (token == null || token.isExpired()) {
                res = rpsToken().andThen(authorize());
            } else {
                res = Single.just(token);
            }
            return res.map(blizzardAuthToken -> {
                this.token.set(blizzardAuthToken);
                return blizzardAuthToken;
            });
        });
    }

    public Maybe<PvpLeaderBoard> pvpLeaderboard(String bracket, String region) {
        return pvpLeaderboard(region, CURRENT_PVP_SEASON_ID, bracket, "dynamic-" + region);
    }

    public Maybe<WowAPICharacter> character(String region, String fullName) {
        String name = fullName.split("-")[0];
        String realm = fullName.substring(name.length() + 1);
        return character(region, realm, name);
    }

    public Maybe<WowAPICharacter> character(String region, String realm, String name) {
        String realRegion;
        String realNamespace;
        realRegion = realRegion(region);
        realNamespace = "profile-" + realRegion;
        String realmSearch = URLEncoder.encode(realm.replaceAll(" ", "-").replaceAll("'", "").toLowerCase(), StandardCharsets.UTF_8);
        String nameSearch = URLEncoder.encode(name.toLowerCase(), StandardCharsets.UTF_8);
        String absoluteURI = "https://" + realRegion + ".api.blizzard.com/profile/wow/character/" + realmSearch + "/" + nameSearch;
        return token().flatMapMaybe(blizzardAuthToken ->
            maybeResponse(realNamespace, absoluteURI)
                .flatMap(json -> {
                    Maybe<WowAPICharacter> res;
                    if (json.getInteger("code") != null && json.getInteger("code") == 404) {
                        log.debug("Character not found: " + name + " on " + realm + " in " + realRegion);
                        res = Maybe.empty();
                    } else {
                        log.debug("Found Character:  " + name + " on " + realm + " in " + realRegion);
                        res = maybeResponse(realNamespace, json.getJsonObject("pvp_summary").getString("href"))
                            .flatMap(pvp -> {
                                JsonArray bracketFromJson = pvp.getJsonArray("brackets");
                                if (bracketFromJson == null) {
                                    bracketFromJson = new JsonArray();
                                }
                                return Maybe.concatEager(
                                        bracketFromJson.stream()
                                            .map(o -> ((JsonObject) o).getString("href"))
                                            .map(ref -> maybeResponse(realNamespace, ref)
                                            ).toList()
                                    ).toList()
                                    .flatMapMaybe(brackets ->
                                        maybeResponse(realNamespace, absoluteURI + "/achievements")
                                            .flatMap(achievements ->
                                                maybeResponse(realNamespace, absoluteURI + "/character-media")
                                                    .flatMap(media ->
                                                        maybeResponse(realNamespace, absoluteURI + "/collections/pets")
                                                            .flatMap(pets ->
                                                                maybeResponse(realNamespace, absoluteURI + "/specializations")
                                                                    .flatMap(specs -> {
                                                                        Optional<WowAPICharacter> prev = Optional.ofNullable(characterCache.getByFullName(Character.fullNameByRealmAndName(name, realm)));
                                                                        Cutoffs ctfs = cutoffs.get(realRegion);
                                                                        if (ctfs == null) {
                                                                            return Maybe.error(new IllegalStateException("No cutoffs for region " + region));
                                                                        }
                                                                        return Maybe.just(WowAPICharacter.parse(prev, refs, ctfs, json, pvp, brackets, achievements, media, specs, pets, realRegion));
                                                                    }))))
                                    );
                            })
                            .doOnError(e -> log.error("Error parsing character: " + name + " on " + realm + " in " + realRegion, e))
                            .onErrorResumeNext(Maybe.empty());
                    }
                    return res;
                })
        );
    }

    Maybe<JsonObject> maybeResponse(String namespace, String url) {
        return token().flatMapMaybe(blizzardAuthToken ->
            rpsToken().andThen(
                webClient.getAbs(url)
                    .addQueryParam("namespace", namespace)
                    .addQueryParam("locale", LOCALE)
                    .bearerTokenAuthentication(blizzardAuthToken.accessToken())
                    .rxSend()
                    .flatMapMaybe(resp -> {
                        if (resp.statusCode() == 200) {
                            return Maybe.just(resp.bodyAsJsonObject());
                        } else if (resp.statusCode() == 429 || resp.statusCode() / 100 == 5) {
                            int code = resp.statusCode();
                            log.info(code + " Retrying " + url + " " + resp.statusMessage());
                            return rpsToken().andThen(rpsToken()).andThen(maybeResponse(namespace, url));
                        } else {
                            return Maybe.error(new IllegalStateException("Error getting " + url + " " + resp.statusCode() + " " + resp.statusMessage() + " " + resp.bodyAsString()));
                        }
                    })
            )
        );
    }

    public static String realRegion(String region) {
        String realRegion;
        if (region.equals("en-gb")) {
            realRegion = "eu";
        } else if (region.equals("en-us")) {
            realRegion = "us";
        } else {
            realRegion = region;
        }
        return realRegion;
    }

    public static String oldRegion(String region) {
        String oldRegion;
        if (region.equals("eu")) {
            oldRegion = EU;
        } else if (region.equals("us")) {
            oldRegion = US;
        } else {
            oldRegion = region;
        }
        return oldRegion;
    }

    public Maybe<PvpLeaderBoard> pvpLeaderboard(String region, String pvpSeasonId, String pvpBracket, String namespace) {
        String realRegion;
        String realNamespace;
        String realPvpBracket;
        if (region.equals("en-gb")) {
            realRegion = "eu";
            realNamespace = "dynamic-eu";
        } else if (region.equals("en-us")) {
            realRegion = "us";
            realNamespace = "dynamic-us";
        } else {
            realRegion = region;
            realNamespace = namespace;
        }
        if (pvpBracket.equals("battlegrounds")) {
            realPvpBracket = "rbg";
        } else {
            realPvpBracket = pvpBracket;
        }
        String url = "https://" + realRegion + ".api.blizzard.com/data/wow/pvp-season/" + pvpSeasonId + "/pvp-leaderboard/" + realPvpBracket;
        return Maybe.defer(() ->
                token().flatMapMaybe(blizzardAuthToken -> maybeResponse(realNamespace, url)).map(PvpLeaderBoard::fromJson)
            )
            .doOnSubscribe(disposable -> log.info("Getting leaderboard for region={} ssn={} bracket={}", realRegion, pvpSeasonId, realPvpBracket))
            .doOnError(er -> log.error("Error fetching Blizzard PVP leaderboard", er))
            .onErrorResumeNext(Maybe.empty());
    }

    private Single<BlizzardAuthToken> authorize() {
        MultiMap form = MultiMap.caseInsensitiveMultiMap();
        form.set("grant_type", "client_credentials");
        return webClient.postAbs(AUTH_URL)
            .addQueryParam("grant_type", "client_credentials")
            .basicAuthentication(clientId, clientSecret)
            .rxSendForm(form)
            .map(response -> BlizzardAuthToken.fromJson(response.bodyAsJsonObject()))
            .doOnSuccess(token -> log.info("Got token: {}", token));
    }

    public Single<Cutoffs> cutoffs(String region) {
        return cutoffs(region, CURRENT_PVP_SEASON_ID);
    }

    public Single<Cutoffs> cutoffs(String region, String pvpSsnId) {
        String realRegion = realRegion(region);
        return token().flatMap(blizzardAuthToken ->
            webClient.getAbs("https://" + realRegion + ".api.blizzard.com/data/wow/pvp-season/" + pvpSsnId + "/pvp-reward/index")
                .addQueryParam("namespace", "dynamic-" + realRegion)
                .addQueryParam("locale", LOCALE)
                .bearerTokenAuthentication(blizzardAuthToken.accessToken())
                .rxSend()
                .map(HttpResponse::bodyAsJsonObject)
                .map(res -> Cutoffs.fromBlizzardJson(realRegion, res))
        );
    }
}
