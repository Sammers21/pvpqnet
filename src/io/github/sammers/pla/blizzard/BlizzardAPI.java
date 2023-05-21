package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.Main;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.MultiMap;
import io.vertx.reactivex.ext.web.client.HttpResponse;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Blizzard API.
 */
public class BlizzardAPI {

    public static final String AUTH_URL = "https://oauth.battle.net/token";
    public static String LOCALE = "en_US";
    private static final String CURRENT_PVP_SEASON_ID = "35";
    private static final Logger log = LoggerFactory.getLogger(BlizzardAPI.class);
    private final String clientSecret;
    private final WebClient webClient;
    private final String clientId;
    private final AtomicReference<BlizzardAuthToken> token = new AtomicReference<>();

    public BlizzardAPI(String clientId, String clientSecret, WebClient webClient) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.webClient = webClient;
    }

    public Single<BlizzardAuthToken> token() {
        return Single.defer(() -> {
            final BlizzardAuthToken token = this.token.get();
            final Single<BlizzardAuthToken> res;
            if (token == null || token.isExpired()) {
                res = authorize();
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

    public Maybe<WowAPICharacter> character(String region, String realm, String name) {
        String realRegion;
        String realNamespace;
        realRegion = realRegion(region);
        realNamespace = "profile-" + realRegion;
        String realmSearch = URLEncoder.encode(realm.replaceAll(" ", "-").replaceAll("'", "").toLowerCase(), StandardCharsets.UTF_8);
        String nameSearch = URLEncoder.encode(name.toLowerCase(), StandardCharsets.UTF_8);
        String absoluteURI = "https://" + realRegion + ".api.blizzard.com/profile/wow/character/" + realmSearch + "/" + nameSearch;
        return token().flatMapMaybe(blizzardAuthToken ->
            webClient.getAbs(absoluteURI)
                .addQueryParam("namespace", realNamespace)
                .addQueryParam("locale", LOCALE)
                .bearerTokenAuthentication(blizzardAuthToken.accessToken())
                .rxSend()
                .map(HttpResponse::bodyAsJsonObject)
                .flatMapMaybe(json -> {
                    Maybe<WowAPICharacter> res;
                    if (json.getInteger("code") != null && json.getInteger("code") == 404) {
                        log.debug("Character not found: " + name + " on " + realm + " in " + realRegion);
                        res = Maybe.empty();
                    } else {
                        log.debug("Found Character:  " + name + " on " + realm + " in " + realRegion);
                        res = webClient.getAbs(json.getJsonObject("pvp_summary").getString("href"))
                                .addQueryParam("namespace", realNamespace)
                                .addQueryParam("locale", LOCALE)
                                .bearerTokenAuthentication(blizzardAuthToken.accessToken())
                                .rxSend()
                                .map(HttpResponse::bodyAsJsonObject)
                                .flatMapMaybe(pvp -> Single.concatEager(
                                        pvp.getJsonArray("brackets").stream()
                                                .map(o -> ((JsonObject) o).getString("href"))
                                                .map(ref -> webClient.getAbs(ref)
                                                        .addQueryParam("namespace", realNamespace)
                                                        .addQueryParam("locale", LOCALE)
                                                        .bearerTokenAuthentication(blizzardAuthToken.accessToken())
                                                        .rxSend()
                                                        .map(HttpResponse::bodyAsJsonObject)
                                                ).toList()
                                ).toList().flatMapMaybe(brackets -> Maybe.just(WowAPICharacter.parse(json, pvp, brackets, realRegion))));
                    }
                    return res;
                })
        );
    }

    private static String realRegion(String region) {
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
        return Single.defer(() -> token().flatMap(
                blizzardAuthToken ->
                    webClient.getAbs("https://" + realRegion + ".api.blizzard.com/data/wow/pvp-season/" + pvpSeasonId + "/pvp-leaderboard/" + realPvpBracket)
                        .addQueryParam("namespace", realNamespace)
                        .addQueryParam("locale", LOCALE)
                        .bearerTokenAuthentication(blizzardAuthToken.accessToken())
                        .rxSend()
                        .map(HttpResponse::bodyAsJsonObject)
            )
            .map(PvpLeaderBoard::fromJson)
        ).doOnSubscribe(disposable -> log.info("Getting leaderboard for region={} ssn={} bracket={}", realRegion, pvpSeasonId, realPvpBracket))
            .toMaybe()
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
