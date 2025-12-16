package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.logic.CharacterCache;
import io.github.sammers.pla.logic.Refs;
import io.github.sammers.pla.ratelim.ComposedRateLimiter;
import io.github.sammers.pla.ratelim.RateLimiterV2;
import io.github.sammers.pla.ratelim.RxRateLimiterImpl;
import io.prometheus.metrics.core.metrics.Counter;
import io.prometheus.metrics.core.metrics.Gauge;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Maybe;
import io.reactivex.rxjava3.core.Single;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.core.MultiMap;
import io.vertx.ext.auth.oauth2.OAuth2AuthorizationURL;
import io.vertx.ext.auth.oauth2.OAuth2Options;
import io.vertx.rxjava3.core.Vertx;
import io.vertx.rxjava3.ext.auth.oauth2.OAuth2Auth;
import io.vertx.rxjava3.ext.web.client.HttpResponse;
import io.vertx.rxjava3.ext.web.client.WebClient;
import org.javatuples.Pair;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static io.github.sammers.pla.logic.Conts.EU;
import static io.github.sammers.pla.logic.Conts.US;

/**
 * Blizzard API.
 */
public class BlizzardAPI {
  public static final String AUTH_URL = "https://oauth.battle.net/token";
  public static String LOCALE = "en_US";
  public static final Integer CURRENT_PVP_SEASON_ID = 40;
  private static final Logger log = LoggerFactory.getLogger(BlizzardAPI.class);
  private final String clientSecret;
  private final WebClient webClient;
  private final Refs refs;
  private final CharacterCache characterCache;
  private final Map<String, Cutoffs> cutoffs;
  private final String clientId;
  private final AtomicReference<BlizzardAuthToken> token = new AtomicReference<>();
  private final RxRateLimiterImpl rateLimiter;
  private final Counter rqCounter;
  private final String keyName;
  private final String callbackUrl;
  private final OAuth2Auth oauth2;

  public BlizzardAPI(Vertx vertx, Gauge permits, Counter limiterAcquiredCounter, Counter rqCounter, String keyName,
    String clientId, String clientSecret, String callbackUrl, WebClient webClient, Refs refs,
    CharacterCache characterCache, Map<String, Cutoffs> cutoffs, boolean preloadToken) {
    this.rqCounter = rqCounter;
    this.keyName = keyName;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.callbackUrl = callbackUrl.trim();
    this.webClient = webClient;
    log.info("BlizzardAPI initialized with callbackUrl='{}'", this.callbackUrl);
    this.refs = refs;
    this.characterCache = characterCache;
    this.cutoffs = cutoffs;
    this.oauth2 = OAuth2Auth.create(vertx,
      new OAuth2Options().setClientId(clientId)
        .setClientSecret(clientSecret)
        .setSite("https://oauth.battle.net")
        .setTokenPath("/token")
        .setAuthorizationPath("/authorize")
        .setUserInfoPath("/userinfo"));
    // Compose rate limiters: 100 per second AND 36000 per hour
    String limiterBase = "blizzard-api-" + keyName;
    RateLimiterV2 perSecond = new RateLimiterV2(limiterBase + "-100-per-sec", 100, 1, TimeUnit.SECONDS, preloadToken, permits,
      limiterAcquiredCounter, Main.VTHREAD_SCHEDULER);
    RateLimiterV2 perHour = new RateLimiterV2(limiterBase + "-36000-per-hr", 36000, 1, TimeUnit.HOURS, preloadToken, permits,
      limiterAcquiredCounter, Main.VTHREAD_SCHEDULER);
    ComposedRateLimiter composed = new ComposedRateLimiter(limiterBase, perSecond, perHour);
    this.rateLimiter = new RxRateLimiterImpl(limiterBase, composed);
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

  public Single<Boolean> characterStatus(String region, String realm, String name) {
    String realRegion = realRegion(region);
    String realNamespace = "profile-" + realRegion;
    String realmSearch = URLEncoder.encode(realm.replaceAll(" ", "-").replaceAll("'", "").toLowerCase(),
      StandardCharsets.UTF_8);
    String nameSearch = URLEncoder.encode(name.toLowerCase(), StandardCharsets.UTF_8);
    String url = "https://" + realRegion + ".api.blizzard.com/profile/wow/character/" + realmSearch + "/" + nameSearch
      + "/status";
    rqCounter.labelValues("character-status", keyName).inc();
    return maybeResponse(realNamespace, url).map(json -> Optional.ofNullable(json.getBoolean("is_valid")).orElse(true))
      .defaultIfEmpty(true)
      .onErrorReturn(err -> err.getMessage() == null || !err.getMessage().contains("404"));
  }

  public Maybe<WowAPICharacter> character(String region, String realm, String name) {
    String realRegion;
    String realNamespace;
    realRegion = realRegion(region);
    realNamespace = "profile-" + realRegion;
    String realmSearch = URLEncoder.encode(realm.replaceAll(" ", "-").replaceAll("'", "").toLowerCase(),
      StandardCharsets.UTF_8);
    String nameSearch = URLEncoder.encode(name.toLowerCase(), StandardCharsets.UTF_8);
    String absoluteURI = "https://" + realRegion + ".api.blizzard.com/profile/wow/character/" + realmSearch + "/"
      + nameSearch;
    return token().flatMapMaybe(blizzardAuthToken -> {
      long tick = System.nanoTime();
      rqCounter.labelValues("character", keyName).inc();
      return maybeResponse(realNamespace, absoluteURI).flatMap(json -> {
        Maybe<WowAPICharacter> res;
        if (json.getInteger("code") != null && json.getInteger("code") == 404) {
          log.debug("Character not found: " + name + " on " + realm + " in " + realRegion);
          res = Maybe.empty();
        } else {
          log.debug("Found Character:  " + name + " on " + realm + " in " + realRegion);
          res = maybeResponse(realNamespace, json.getJsonObject("pvp_summary").getString("href")).flatMap(pvp -> {
            JsonArray bracketFromJson = pvp.getJsonArray("brackets");
            if (bracketFromJson == null) {
              bracketFromJson = new JsonArray();
            }
            Single<List<JsonObject>> bracketList = Maybe.concatEager(bracketFromJson.stream()
              .map(o -> ((JsonObject) o).getString("href"))
              .map(ref -> maybeResponse(realNamespace, ref))
              .toList()).toList();
            rqCounter.labelValues("brackets", keyName).inc(bracketFromJson.size());
            Single<Optional<JsonObject>> achievementsRx = optionalResponse(realNamespace,
              absoluteURI + "/achievements");
            rqCounter.labelValues("achievements", keyName).inc();
            Single<Optional<JsonObject>> mediaRx = optionalResponse(realNamespace, absoluteURI + "/character-media");
            rqCounter.labelValues("character-media", keyName).inc();
            Single<Optional<JsonObject>> petsRx = optionalResponse(realNamespace, absoluteURI + "/collections/pets");
            rqCounter.labelValues("pets", keyName).inc();
            Single<Optional<JsonObject>> specsRx = optionalResponse(realNamespace, absoluteURI + "/specializations");
            rqCounter.labelValues("specializations", keyName).inc();
            Single<List<Optional<JsonObject>>> otherStuffRx = Single.zip(achievementsRx, mediaRx, petsRx, specsRx,
              (a, m, p, s) -> List.of(a, m, p, s));
            return Single.zip(bracketList, otherStuffRx, Pair::new).flatMapMaybe(pair -> {
              List<JsonObject> brackets = pair.getValue0();
              List<Optional<JsonObject>> otherStuff = pair.getValue1();
              Optional<WowAPICharacter> prev = Optional
                .ofNullable(characterCache.getByFullName(Character.fullNameByRealmAndName(name, realm)));
              Optional<Cutoffs> ctfs = Optional.ofNullable(cutoffs.get(realRegion));
              WowAPICharacter parsed = WowAPICharacter.parse(characterCache, prev, refs, ctfs, json, pvp, brackets,
                otherStuff.get(0), otherStuff.get(1), otherStuff.get(3), otherStuff.get(2), realRegion);
              return Maybe.just(parsed);
            }).doOnSuccess(wowAPICharacter -> {
              long elapsed = System.nanoTime() - tick;
              log.debug("Parsed character {} in {} ms", wowAPICharacter.fullName(), elapsed / 1000000);
            });
          })
            .doOnError(e -> log.error("Error parsing character: " + name + " on " + realm + " in " + realRegion, e))
            .onErrorResumeNext(e -> Maybe.empty());
        }
        return res;
      });
    });
  }

  Maybe<JsonObject> maybeResponse(String namespace, String url) {
    return token().flatMapMaybe(blizzardAuthToken -> rpsToken().andThen(Maybe.defer(() -> {
      log.debug("Getting " + url);
      return webClient.getAbs(url)
        .addQueryParam("namespace", namespace)
        .addQueryParam("locale", LOCALE)
        .bearerTokenAuthentication(blizzardAuthToken.accessToken())
        .timeout(TimeUnit.MINUTES.toMillis(10))
        .rxSend()
        .onErrorResumeNext(er -> {
          log.error("Error getting " + url, er);
          return Single.error(er);
        })
        .flatMapMaybe(resp -> {
          log.debug("Got response to" + url + " " + resp.statusCode());
          if (resp.statusCode() == 200) {
            return Maybe.just(resp.bodyAsJsonObject());
          } else if (resp.statusCode() == 429 || resp.statusCode() / 100 == 5) {
            int code = resp.statusCode();
            log.info(code + " Retrying " + url + " " + resp.statusMessage());
            return rpsToken().andThen(rpsToken()).andThen(maybeResponse(namespace, url));
          } else {
            return Maybe.error(new IllegalStateException("Error getting " + url + " " + resp.statusCode() + " "
              + resp.statusMessage() + " " + resp.bodyAsString()));
          }
        });
    })));
  }

  Single<Optional<JsonObject>> optionalResponse(String namespace, String url) {
    return maybeResponse(namespace, url).map(Optional::of)
      .defaultIfEmpty(Optional.empty())
      .onErrorReturnItem(Optional.empty());
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

  public Maybe<PvpLeaderBoard> pvpLeaderboard(String region, Integer pvpSeasonId, String pvpBracket, String namespace) {
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
    String url = "https://" + realRegion + ".api.blizzard.com/data/wow/pvp-season/" + pvpSeasonId + "/pvp"
      + "-leaderboard/" + realPvpBracket;
    return Maybe.defer(() -> {
      return token().flatMapMaybe(blizzardAuthToken -> {
        rqCounter.labelValues("pvp-leaderboard", keyName).inc();
        return maybeResponse(realNamespace, url);
      }).map(PvpLeaderBoard::fromJson);
    })
      .doOnSubscribe(disposable -> log.info("Getting leaderboard for region={} ssn={} bracket={}", realRegion,
        pvpSeasonId, realPvpBracket))
      .doOnError(er -> log.error("Error fetching Blizzard PVP leaderboard", er))
      .onErrorResumeNext(e -> Maybe.empty());
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

  public Single<Realms> realms(String region) {
    return Single.defer(() -> {
      long tick = System.currentTimeMillis();
      String realRegion = realRegion(region);
      String namespace = "dynamic-" + realRegion;
      String url = "https://" + realRegion + ".api.blizzard.com/data/wow/connected-realm/index";
      rqCounter.labelValues("connected-realm/index", keyName).inc();
      return maybeResponse(namespace, url).flatMapSingle(index -> {
        List<String> hrefs = index.getJsonArray("connected_realms")
          .stream()
          .map(o -> ((JsonObject) o).getString("href"))
          .toList();
        List<Maybe<JsonObject>> list = hrefs.stream().map(href -> {
          rqCounter.labelValues("connected-realm/href", keyName).inc();
          return maybeResponse(namespace, href);
        }).toList();
        return Maybe.merge(list).toList().map(responses -> {
          log.info("Realms for {} fetched in {}ms", realRegion, System.currentTimeMillis() - tick);
          return Realms.fromBlizzardJson(realRegion, index, responses);
        });
      }).toSingle();
    });
  }

  public Single<Cutoffs> cutoffs(String region) {
    return cutoffs(region, CURRENT_PVP_SEASON_ID);
  }

  public Single<Cutoffs> cutoffs(String region, Integer pvpSsnId) {
    String realRegion = realRegion(region);
    return token().flatMap(blizzardAuthToken -> webClient
      .getAbs("https://" + realRegion + ".api.blizzard" + ".com/data/wow/pvp-season/" + pvpSsnId + "/pvp-reward/index")
      .addQueryParam("namespace", "dynamic-" + realRegion)
      .addQueryParam("locale", LOCALE)
      .bearerTokenAuthentication(blizzardAuthToken.accessToken())
      .rxSend()
      .map(HttpResponse::bodyAsJsonObject)
      .map(res -> Cutoffs.fromBlizzardJson(realRegion, res)));
  }

  /**
   * Fetch character equipment on-demand.
   *
   * @param region
   *          The region (eu, us)
   * @param realm
   *          The realm name
   * @param name
   *          The character name
   * @return List of equipped items
   */
  public Maybe<List<EquippedItem>> equipment(String region, String realm, String name) {
    String realRegion = realRegion(region);
    String realNamespace = "profile-" + realRegion;
    String realmSearch = URLEncoder.encode(realm.replaceAll(" ", "-").replaceAll("'", "").toLowerCase(),
      StandardCharsets.UTF_8);
    String nameSearch = URLEncoder.encode(name.toLowerCase(), StandardCharsets.UTF_8);
    String url = "https://" + realRegion + ".api.blizzard.com/profile/wow/character/" + realmSearch + "/" + nameSearch
      + "/equipment";
    rqCounter.labelValues("equipment", keyName).inc();
    return maybeResponse(realNamespace, url).map(EquippedItem::parseEquipment)
      .doOnError(e -> log.error("Error fetching equipment for {} on {} in {}", name, realm, realRegion, e))
      .onErrorResumeNext(e -> Maybe.empty());
  }

  public Maybe<JsonObject> talents(String region, String realm, String name) {
    String realRegion = realRegion(region);
    String realNamespace = "profile-" + realRegion;
    String realmSearch = URLEncoder.encode(realm.replaceAll(" ", "-").replaceAll("'", "").toLowerCase(),
      StandardCharsets.UTF_8);
    String nameSearch = URLEncoder.encode(name.toLowerCase(), StandardCharsets.UTF_8);
    String url = "https://" + realRegion + ".api.blizzard.com/profile/wow/character/" + realmSearch + "/" + nameSearch
      + "/specializations";
    rqCounter.labelValues("specializations", keyName).inc();
    return maybeResponse(realNamespace, url)
      .doOnError(e -> log.error("Error fetching talents for {} on {} in {}", name, realm, realRegion, e))
      .onErrorResumeNext(e -> Maybe.empty());
  }

  /**
   * @param ref
   *          ref of the link user came from
   * @return auth link
   */
  public String authLink(String ref) {
    return oauth2.authorizeURL(new OAuth2AuthorizationURL().setRedirectUri(callbackUrl)
      .addScope("wow.profile")
      .addScope("openid")
      .setState(ref));
  }

  public Single<JsonObject> exchangeCodeForToken(String code) {
    log.info("Exchanging code for token with redirect_uri='{}'", callbackUrl);
    MultiMap form = MultiMap.caseInsensitiveMultiMap();
    form.set("grant_type", "authorization_code");
    form.set("code", code);
    form.set("redirect_uri", callbackUrl);
    return webClient.postAbs(AUTH_URL).basicAuthentication(clientId, clientSecret).rxSendForm(form).map(response -> {
      if (response.statusCode() == 200) {
        return response.bodyAsJsonObject();
      } else {
        throw new RuntimeException("Token exchange failed: " + response.bodyAsString());
      }
    });
  }

  public Single<JsonObject> userInfo(String accessToken) {
    return webClient.getAbs("https://oauth.battle.net/userinfo")
      .bearerTokenAuthentication(accessToken)
      .rxSend()
      .map(HttpResponse::bodyAsJsonObject);
  }

  public Single<List<UsersCharacter>> userCharacters(String accessToken, String region) {
    String realRegion = realRegion(region);
    String namespace = "profile-" + realRegion;
    String url = "https://" + realRegion + ".api.blizzard.com/profile/user/wow";
    return webClient.getAbs(url)
      .addQueryParam("namespace", namespace)
      .addQueryParam("locale", LOCALE)
      .bearerTokenAuthentication(accessToken)
      .rxSend()
      .map(HttpResponse::bodyAsJsonObject)
      .map(json -> {
        JsonArray accounts = json.getJsonArray("wow_accounts");
        List<UsersCharacter> characters = new java.util.ArrayList<>();
        if (accounts != null) {
          for (Object account : accounts) {
            JsonArray chars = ((JsonObject) account).getJsonArray("characters");
            if (chars != null) {
              for (Object charObj : chars) {
                try {
                  characters.add(UsersCharacter.fromJson((JsonObject) charObj, region));
                } catch (Exception e) {
                  log.warn("Error parsing user character", e);
                }
              }
            }
          }
        }
        return characters;
      })
      .onErrorReturnItem(List.of());
  }
}
