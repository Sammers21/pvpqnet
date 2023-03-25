package io.github.sammers.pla;

import io.reactivex.Single;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.MultiMap;
import io.vertx.reactivex.ext.web.client.HttpResponse;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Blizzard API.
 */
public class BlizzardAPI {

    public static final String AUTH_URL = "https://oauth.battle.net/token";
    private static final String CURRENT_PVP_SEASON_ID = "34";
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

    public Single<PvpLeaderBoard> pvpLeaderboard(String bracket, String region) {
        return pvpLeaderboard(region, CURRENT_PVP_SEASON_ID, bracket, "dynamic-" + region);
    }

    public Single<PvpLeaderBoard> pvpLeaderboard(String region, String pvpSeasonId, String pvpBracket, String namespace) {
        String locale = "en_US";
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
        if (pvpBracket.equals("shuffle")) {
            List<String> shuffleSpecs = Ladder.shuffleSpecs.stream().map(spec -> spec.replaceAll("/", "-")).toList();
            Single<PvpLeaderBoard> res = Single.just(new PvpLeaderBoard(new JsonObject(), new JsonObject(), "shuffle", new JsonObject(), new JsonArray()));
            for (String shuffleSpec : shuffleSpecs) {
                res = res.flatMap(
                    cur -> pvpLeaderboard(realRegion, pvpSeasonId, shuffleSpec, realNamespace)
                        .map(cur::combine)
                );
            }
            return res;
        }
        return Single.defer(() -> token().flatMap(
                blizzardAuthToken ->
                    webClient.getAbs("https://" + realRegion + ".api.blizzard.com/data/wow/pvp-season/" + pvpSeasonId + "/pvp-leaderboard/" + realPvpBracket)
                        .addQueryParam("namespace", realNamespace)
                        .addQueryParam("locale", locale)
                        .bearerTokenAuthentication(blizzardAuthToken.accessToken())
                        .rxSend()
                        .map(HttpResponse::bodyAsJsonObject)
            )
            .map(PvpLeaderBoard::fromJson)
        ).doOnSubscribe(disposable -> log.info("Getting leaderboard for region={} ssn={} bracket={}", realRegion, pvpSeasonId, realPvpBracket));
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
}
