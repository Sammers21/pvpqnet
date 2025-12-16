package io.github.sammers.pla.http;

import io.github.sammers.pla.blizzard.*;
import io.github.sammers.pla.db.*;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.logic.*;
import io.reactivex.rxjava3.core.Single;
import io.vertx.core.http.Cookie;
import io.vertx.core.http.HttpServerOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.rxjava3.core.Vertx;
import io.vertx.rxjava3.ext.web.Router;
import io.vertx.rxjava3.ext.web.RoutingContext;
import io.vertx.rxjava3.ext.web.handler.CorsHandler;
import org.javatuples.Pair;
import org.slf4j.Logger;

import java.util.*;
import java.util.stream.Stream;

import static io.github.sammers.pla.Main.VTHREAD_EXECUTOR;
import static io.github.sammers.pla.logic.Conts.*;

public class Http {
  private static final Logger log = org.slf4j.LoggerFactory.getLogger(Http.class);
  private static final Integer SEARCH_RESULT_SIZE = 20;
  private static final List<Multiclassers.Role> MULTICLASSER_ROLES = List.of(Multiclassers.Role.ALL, Multiclassers.Role.DPS, Multiclassers.Role.HEALER, Multiclassers.Role.MELEE, Multiclassers.Role.RANGED, Multiclassers.Role.TANK);
  private final Vertx vertx;
  private final Ladder ladder;
  private final Refs refs;
  private final CharacterCache characterCache;
  private final UserLogic userLogic;
  private final RealmStats realmStats;
  private final DB db;

  public Http(Vertx vertx, Ladder ladder, Refs refs, CharacterCache characterCache, UserLogic userLogic, DB db) {
    this.vertx = vertx;
    this.ladder = ladder;
    this.refs = refs;
    this.characterCache = characterCache;
    this.realmStats = characterCache.realmStats;
    this.userLogic = userLogic;
    this.db = db;
  }

  public void start() {
    Router router = Router.router(vertx);
    router.route().handler(CorsHandler.create());
    router.route().handler(ctx -> {
      ctx.response().putHeader("Content-Type", "application/json");
      ctx.next();
    });
    router.route().handler(new HttpMetricsCollector());
    router.get("/api/cabinet").handler(ctx -> {
      String token = ctx.request().getParam("token");
      if (token == null) {
        Cookie sessionCookie = ctx.request().getCookie("session");
        if (sessionCookie != null) {
          token = sessionCookie.getValue();
        }
      }
      if (token == null) {
        ctx.response().setStatusCode(400).end();
        return;
      }
      Single<Optional<User>> userSingle = userLogic.getUserByCookie(token);
      userSingle.subscribe(userOpt -> {
        if (userOpt.isPresent()) {
          User user = userOpt.get();
          Map<Long, WowAPICharacter> fromCache = new HashMap<>();
          Set<Long> missing = new HashSet<>();
          for (UsersCharacter ch : user.characters()) {
            if (ch == null || ch.id() == null) {
              continue;
            }
            WowAPICharacter resolved = characterCache.getById(ch.id());
            if (resolved != null) {
              fromCache.put(ch.id(), resolved);
            } else {
              missing.add(ch.id());
            }
          }
          if (missing.isEmpty()) {
            User resp = user.withNewCharacters(user.characters().stream().map(character -> {
              WowAPICharacter resolved = character != null ? fromCache.get(character.id()) : null;
              return resolved != null ? character.withResolved(resolved) : character;
            }).toList());
            ctx.response().setStatusCode(200).end(resp.toPublicJson().encodePrettily());
            return;
          }
          db.getCharactersByIds(missing).subscribe(charsFromDb -> {
            Map<Long, WowAPICharacter> fromDb = charsFromDb.stream()
              .filter(Objects::nonNull)
              .collect(java.util.stream.Collectors.toMap(WowAPICharacter::id, c -> c, (a, b) -> a));
            User resp = user.withNewCharacters(user.characters().stream().map(character -> {
              WowAPICharacter resolved = character != null ? fromCache.get(character.id()) : null;
              if (resolved == null) {
                resolved = character != null ? fromDb.get(character.id()) : null;
              }
              return resolved != null ? character.withResolved(resolved) : character;
            }).toList());
            ctx.response().setStatusCode(200).end(resp.toPublicJson().encodePrettily());
          }, err -> {
            log.error("Failed to load cabinet characters from DB", err);
            User resp = user.withNewCharacters(user.characters().stream().map(character -> {
              WowAPICharacter resolved = character != null ? fromCache.get(character.id()) : null;
              return resolved != null ? character.withResolved(resolved) : character;
            }).toList());
            ctx.response().setStatusCode(200).end(resp.toPublicJson().encodePrettily());
          });
        } else {
          ctx.redirect("/api/auth");
        }
      });
    });
    router.get("/api/cabinet/bnet-sync").handler(ctx -> {
      String token = ctx.request().getParam("token");
      if (token == null) {
        Cookie sessionCookie = ctx.request().getCookie("session");
        if (sessionCookie != null) {
          token = sessionCookie.getValue();
        }
      }
      if (token == null) {
        ctx.response().setStatusCode(401).end(new JsonObject().put("redirect", "/api/auth").encode());
        return;
      }
      userLogic.getUserByCookie(token).subscribe(userOpt -> {
        if (userOpt.isPresent()) {
          User user = userOpt.get();
          if (user.battleNetAccessToken().isPresent() && !user.battleNetAccessToken().get().isExpired()) {
            userLogic.updateUsersCharacters(user).subscribe(updatedUser -> {
              ctx.response().end(updatedUser.toPublicJson().encode());
            }, err -> {
              log.error("Failed to sync characters", err);
              ctx.response().setStatusCode(500).end(new JsonObject().put("error", "Sync failed").encode());
            });
          } else {
            String returnUrl = ctx.request().headers().get("Referer");
            if (returnUrl == null)
              returnUrl = "https://pvpq.net/cabinet";
            String authUrl = "/api/auth?return_url=" + java.net.URLEncoder.encode(returnUrl, java.nio.charset.StandardCharsets.UTF_8);
            ctx.response().setStatusCode(401).end(new JsonObject().put("redirect", authUrl).encode());
          }
        } else {
          ctx.response().setStatusCode(401).end(new JsonObject().put("redirect", "/api/auth").encode());
        }
      }, err -> {
        log.error("Error getting user for sync", err);
        ctx.response().setStatusCode(500).end();
      });
    });
    router.get("/api/cabinet/changeVisibility").handler(ctx -> {
      String token = ctx.request().getParam("token");
      if (token == null) {
        Cookie sessionCookie = ctx.request().getCookie("session");
        if (sessionCookie != null) {
          token = sessionCookie.getValue();
        }
      }
      if (token == null) {
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "No session cookie").encode());
        return;
      }
      String to = ctx.request().getParam("to");
      String nickname = ctx.request().getParam("nickname");
      String region = ctx.request().getParam("region");
      if (to == null || nickname == null || region == null) {
        ctx.response().setStatusCode(400).end(new JsonObject().put("error", "Missing params").encode());
        return;
      }
      boolean hidden;
      if ("hidden".equalsIgnoreCase(to)) {
        hidden = true;
      } else if ("public".equalsIgnoreCase(to)) {
        hidden = false;
      } else {
        ctx.response().setStatusCode(400).end(new JsonObject().put("error", "Invalid to param").encode());
        return;
      }
      userLogic.getUserByCookie(token).subscribe(userOpt -> {
        if (userOpt.isEmpty()) {
          ctx.response().setStatusCode(401).end(new JsonObject().put("redirect", "/api/auth").encode());
          return;
        }
        User user = userOpt.get();
        if (!user.hashCharacter(region, nickname)) {
          ctx.response()
            .setStatusCode(403)
            .end(new JsonObject().put("error", "Character does not belong to user").encode());
          return;
        }
        String normalizedRegion = BlizzardAPI.realRegion(region.toLowerCase());
        String normalizedNickname = nickname.trim().toLowerCase().replaceAll(" +", "-").replace("'", "");
        Optional<Long> idOpt = user.characters()
          .stream()
          .filter(Objects::nonNull)
          .filter(ch -> BlizzardAPI.realRegion(Optional.ofNullable(ch.region()).orElse("").toLowerCase())
            .equalsIgnoreCase(normalizedRegion))
          .filter(ch -> Character.fullNameByRealmAndName(ch.name(), ch.realm()).equalsIgnoreCase(normalizedNickname))
          .map(UsersCharacter::id)
          .filter(Objects::nonNull)
          .findFirst();
        if (idOpt.isEmpty()) {
          ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Character not found").encode());
          return;
        }
        ladder.charUpdater.changeVisibility(idOpt.get(), hidden).subscribe(() -> {
          ctx.response().end(new JsonObject().put("ok", true).put("hidden", hidden).encode());
        }, err -> {
          String msg = err.getMessage();
          if (msg != null && msg.contains("not found")) {
            ctx.response().setStatusCode(404).end(new JsonObject().put("error", msg).encode());
            return;
          }
          log.error("Failed to change visibility for {} {}", region, nickname, err);
          ctx.response().setStatusCode(500).end(new JsonObject().put("error", "Failed to change visibility").encode());
        });
      }, err -> {
        log.error("Failed to get user for visibility change", err);
        ctx.response().setStatusCode(500).end(new JsonObject().put("error", "Failed to get user").encode());
      });
    });
    router.get("/api/auth/logout").handler(ctx -> {
      ctx.response().addCookie(Cookie.cookie("session", "").setMaxAge(0).setPath("/")).end();
    });
    router.get("/api/auth").handler(ctx -> {
      String returnUrl = ctx.request().getParam("return_url");
      if (returnUrl == null) {
        returnUrl = "https://pvpq.net/";
      }
      String url = ladder.blizzardAPI.authLink(returnUrl);
      ctx.redirect(url).subscribe();
    });
    router.get("/api/me").handler(ctx -> {
      Cookie sessionCookie = ctx.request().getCookie("session");
      if (sessionCookie == null) {
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "No session cookie").encode());
        return;
      }
      String sessionId = sessionCookie.getValue();
      db.getUserBySession(sessionId).subscribe(userOpt -> {
        if (userOpt.isEmpty()) {
          log.info("User not found by session: {}", sessionId);
          ctx.response().setStatusCode(401).end(new JsonObject().put("error", "User not found").encode());
          return;
        }
        User user = userOpt.get();
        db.invalidateExpired(user).subscribe();
        boolean isValid = user.sessions().stream().anyMatch(s -> s.sessionId().equals(sessionId) && !s.isExpired());
        if (isValid) {
          ctx.response().end(new JsonObject().put("battletag", user.battleNetInfo().battletag()).encode());
        } else {
          ctx.response().setStatusCode(401).end(new JsonObject().put("error", "Session expired").encode());
        }
      }, err -> {
        log.warn("User not found by session", err);
        ctx.response().setStatusCode(401).end(new JsonObject().put("error", "User not found").encode());
      });
    });
    router.get("/api/bnet-auth-callback").handler(this::callbackHandler);
    router.get("/api/status").handler(ctx -> {
      VTHREAD_EXECUTOR.execute(() -> {
        ctx.response().putHeader("Content-Type", "application/json");
        boolean loading = !ladder.isCharsLoaded();
        ctx.response().end(new JsonObject().put("loading", loading).encode());
      });
    });
    router.get("/api/search").handler(ctx -> {
      VTHREAD_EXECUTOR.execute(() -> {
        Optional<String> q = Optional.ofNullable(ctx.request().getParam("q"));
        Optional<String> query = Optional.ofNullable(ctx.request().getParam("query"));
        Optional<String> opt = Stream.of(q, query)
          .filter(Optional::isPresent)
          .map(Optional::get)
          .map(String::toLowerCase)
          .findFirst();
        ctx.response().putHeader("Content-Type", "application/json");
        if (opt.isEmpty()) {
          ctx.response().end(new JsonArray().encode());
        } else {
          try {
            String searchQ = opt.get();
            List<SearchResult> search = ladder.search(searchQ);
            if (search == null) {
              search = new ArrayList<>();
            }
            fillWithSuggestionsTill20(search, searchQ);
            List<JsonObject> list = search.stream()
              .filter(Objects::nonNull)
              .map(SearchResult::toJson)
              .filter(Objects::nonNull)
              .map(j -> j.put("source", "pvpqnet"))
              .toList();
            ctx.response().end(new JsonArray(list).encode());
          } catch (Exception e) {
            log.error("Error processing search query: {}", opt.get(), e);
            ctx.response().setStatusCode(500).end(new JsonArray().encode());
          }
        }
      });
    });
    router.get("/api/meta").handler(ctx -> {
      ctx.response().putHeader("Content-Type", "application/json");
      String bracket = Optional.ofNullable(ctx.request().getParam("bracket")).orElse(THREE_V_THREE);
      String region = Optional.ofNullable(ctx.request().getParam("region")).orElse("eu");
      String role = Optional.ofNullable(ctx.request().getParam("role")).orElse("dps");
      String period = Optional.ofNullable(ctx.request().getParam("period")).orElse("this_season");
      ctx.response()
        .end(Optional.ofNullable(ladder.metaRef(bracket, region, role, period).get())
          .map(Meta::toJson)
          .orElse(new JsonObject())
          .encode());
    });
    router.get("/api/:region/ladder/:bracket").handler(ctx -> {
      String region = ctx.pathParam("region");
      String bracket = ctx.pathParam("bracket");
      if (bracket.equals("rbg")) {
        bracket = RBG;
      }
      if (bracket.equals(MULTICLASSERS)) {
        Multiclassers.Role role = Optional.ofNullable(ctx.request().getParam("role"))
          .map(x -> Multiclassers.Role.valueOf(x.toUpperCase()))
          .orElse(Multiclassers.Role.ALL);
        ladder(ctx, refs.refMulticlassers(role, region).get());
      } else {
        Snapshot snapshot = refs.refByBracket(bracket, region).get();
        if (snapshot == null) {
          ctx.response().end(Snapshot.empty(region).toJson().encode());
        } else {
          ladder(ctx, applySpecFilter(ctx, snapshot.applySlugToName(ladder.realms.get())));
        }
      }
    });
    router.get("/api/:region/activity/stats").handler(ctx -> {
      String region = ctx.pathParam("region");
      Integer twos = Optional.ofNullable(refs.diffsByBracket(TWO_V_TWO, region).get())
        .map(diff -> diff.chars().size())
        .orElse(0);
      Integer threes = Optional.ofNullable(refs.diffsByBracket(THREE_V_THREE, region).get())
        .map(diff -> diff.chars().size())
        .orElse(0);
      Integer rbgs = Optional.ofNullable(refs.diffsByBracket(RBG, region).get())
        .map(diff -> diff.chars().size())
        .orElse(0);
      Integer shuffle = Optional.ofNullable(refs.diffsByBracket(SHUFFLE, region).get())
        .map(diff -> diff.chars().size())
        .orElse(0);
      Integer blitz = Optional.ofNullable(refs.diffsByBracket(BLITZ, region).get())
        .map(diff -> diff.chars().size())
        .orElse(0);
      JsonObject res = new JsonObject().put("2v2", twos)
        .put("3v3", threes)
        .put("rbg", rbgs)
        .put("shuffle", shuffle)
        .put("blitz", blitz);
      Cutoffs cutoffs = ladder.regionCutoff.get(region);
      if (cutoffs != null) {
        res.put("cutoffs", cutoffs.toJsonWithPredictions());
      }
      ctx.response().end(res.encode());
    });
    router.get("/api/:region/activity/:bracket").handler(ctx -> {
      String region = ctx.pathParam("region");
      String bracket = ctx.pathParam("bracket");
      if (bracket.equals("rbg")) {
        bracket = RBG;
      }
      SnapshotDiff snapshotDiff = refs.diffsByBracket(bracket, region).get();
      if (snapshotDiff == null) {
        ctx.response().end(Snapshot.empty(region).toJson().encode());
      } else {
        ladder(ctx, applySpecFilter(ctx, snapshotDiff.applySlugToName(ladder.realms.get())));
      }
    });
    router.get("/api/:region/:realm/:name").handler(ctx -> {
      VTHREAD_EXECUTOR.execute(() -> {
        String realm = ctx.pathParam("realm");
        String name = ctx.pathParam("name");
        nameRealmLookupResponse(ctx, realm, name);
      });
    });
    router.get("/api/:region/:realm/:name/update").handler(ctx -> {
      VTHREAD_EXECUTOR.execute(() -> {
        long tick = System.nanoTime();
        String region = ctx.pathParam("region");
        String realm = ctx.pathParam("realm");
        String name = ctx.pathParam("name");
        if (!ladder.isCharsLoaded()) {
          ctx.response()
            .setStatusCode(503)
            .end(new JsonObject().put("error", "Character data is not loaded yet").encode());
        } else {
          ladder.charUpdater.updateCharFast(region, Character.fullNameByRealmAndName(name, realm))
            .subscribe(wowAPICharacter -> {
              if (wowAPICharacter.isEmpty() || wowAPICharacter.get().hidden()) {
                ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Character not found").encode());
              } else {
                log.info("Updated {} in {} ms", wowAPICharacter.get().fullName(), (System.nanoTime() - tick) / 1000000);
                ctx.response().end(wowCharToJson(wowAPICharacter.get()).encode());
              }
            }, err -> nameRealmLookupResponse(ctx, realm, name));
        }
      });
    });
    router.get("/api/:region/:realm/:name/equipment").handler(ctx -> {
      VTHREAD_EXECUTOR.execute(() -> {
        String region = ctx.pathParam("region");
        String realm = ctx.pathParam("realm");
        String name = ctx.pathParam("name");
        ctx.response().putHeader("Content-Type", "application/json");
        ladder.blizzardAPI.equipment(region, realm, name).subscribe(equipment -> {
          JsonArray items = new JsonArray(equipment.stream()
            .map(io.github.sammers.pla.blizzard.EquippedItem::toJson)
            .toList());
          ctx.response().end(new JsonObject().put("equipment", items).encode());
        }, err -> {
          log.error("Error fetching equipment for {} on {} in {}", name, realm, region, err);
          ctx.response().setStatusCode(500).end(new JsonObject().put("error", "Failed to fetch equipment").encode());
        }, () -> ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Equipment not found").encode()));
      });
    });
    router.get("/api/:region/:realm/:name/talents").handler(ctx -> {
      VTHREAD_EXECUTOR.execute(() -> {
        String region = ctx.pathParam("region");
        String realm = ctx.pathParam("realm");
        String name = ctx.pathParam("name");
        ctx.response().putHeader("Content-Type", "application/json");
        ladder.blizzardAPI.talents(region, realm, name).subscribe(talents -> {
          ctx.response().end(talents.encode());
        }, err -> {
          log.error("Error fetching talents for {} on {} in {}", name, realm, region, err);
          ctx.response().setStatusCode(500).end(new JsonObject().put("error", "Failed to fetch talents").encode());
        }, () -> ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Talents not found").encode()));
      });
    });
    // enable gzip
    vertx.createHttpServer(new HttpServerOptions().setCompressionSupported(true))
      .requestHandler(router)
      .rxListen(9000)
      .subscribe(ignored -> {
        log.info("HTTP server started on port 9000");
      }, err -> {
        log.error("Failed to start HTTP server", err);
      });
  }

  private void callbackHandler(RoutingContext ctx) {
    String code = ctx.request().getParam("code");
    String state = ctx.request().getParam("state");
    if (code == null) {
      ctx.response().setStatusCode(400).end("Missing code");
      return;
    }
    ladder.blizzardAPI.exchangeCodeForToken(code)
      .flatMap(tokenJson -> userLogic.createOrUpdateUser(BlizzardTokenResponse.parse(tokenJson)))
      .subscribe(user -> {
        // Find the latest session we just created
        String sessionCookie = user.sessions()
          .stream()
          .max(Comparator.comparing(PvPQNetSession::issuedAt))
          .map(PvPQNetSession::sessionId)
          .orElseThrow();
        long age = 60 * 60 * 24 * 30 * 6L; // 6 months
        ctx.response().addCookie(Cookie.cookie("session", sessionCookie).setMaxAge(age).setPath("/"));
        ctx.response().putHeader("Location", state != null ? state : "https://pvpq.net/").setStatusCode(302).end();
      }, err -> {
        log.error("Auth callback error", err);
        ctx.response().setStatusCode(500).end("Authentication failed");
      });
  }

  private static void addSearchResults(List<SearchResult> current, List<SearchResult> newRes) {
    Set<SearchResult> searchHash = new HashSet<>(current);
    for (SearchResult newRe : newRes) {
      if (searchHash.add(newRe) && current.size() < SEARCH_RESULT_SIZE) {
        current.add(newRe);
      }
    }
  }

  private void fillWithSuggestionsTill20(List<SearchResult> search, String searchQ) {
    int remaining = 20 - search.size();
    if (remaining > 0) {
      String[] split = searchQ.trim().split("-");
      if (split.length == 1) {
        List<Pair<String, String>> top20 = realmStats.top20Realms();
        List<SearchResult> additionalResults = top20.stream()
          .map(realm -> new SearchResult(String.format("%s-%s", searchQ, realm.getValue0()), realm.getValue1(), null, null, null, null, null, null, null, null))
          .toList();
        search.addAll(additionalResults);
        addSearchResults(search, additionalResults);
      } else if (split.length > 1 && !split[0].isEmpty()) {
        List<Pair<String, String>> top20 = realmStats.realmsStartingWithTop20(split[1]);
        List<SearchResult> additionalResults = top20.stream()
          .map(realm -> new SearchResult(String.format("%s-%s", split[0], realm.getValue0()), realm.getValue1(), null, null, null, null, null, null, null, null))
          .toList();
        search.addAll(additionalResults);
        addSearchResults(search, additionalResults);
      }
    }
  }

  private void nameRealmLookupResponse(RoutingContext ctx, String realm, String name) {
    Optional<WowAPICharacter> charWithName = ladder.wowChar(ladder.realms.get().nameToSlug(realm), name);
    Optional<WowAPICharacter> charWithSlug = ladder.wowChar(realm, name);
    Optional<WowAPICharacter> res = Stream.of(charWithName, charWithSlug)
      .filter(Optional::isPresent)
      .findFirst()
      .map(Optional::get);
    if (res.isEmpty() || res.get().hidden()) {
      ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Character not found").encode());
    } else {
      ctx.response().end(wowCharToJson(res.get()).encode());
    }
  }

  private JsonObject wowCharToJson(WowAPICharacter character) {
    Set<WowAPICharacter> alts = Optional.ofNullable(characterCache.altsFor(character)).orElse(Set.of());
    JsonObject res = character.toJson();
    res.put("alts", new JsonArray(alts.stream()
      .filter(c -> c != null && c.id() != character.id())
      .map(WowAPICharacter::toJson)
      .toList()));
    res.put("multiclassers", buildMulticlassersSummary(character, alts));
    return res;
  }

  private JsonArray buildMulticlassersSummary(WowAPICharacter character, Set<WowAPICharacter> alts) {
    if (character == null || character.region() == null) {
      return new JsonArray();
    }
    String regionKey = BlizzardAPI.oldRegion(character.region());
    Set<String> candidateNames = new HashSet<>();
    candidateNames.add(character.fullName());
    if (alts != null) {
      alts.stream().filter(Objects::nonNull).map(WowAPICharacter::fullName).forEach(candidateNames::add);
    }
    JsonArray summary = new JsonArray();
    for (Multiclassers.Role role : MULTICLASSER_ROLES) {
      Multiclassers leaderboard = Optional.ofNullable(refs.refMulticlassers(role, regionKey).get()).orElse(null);
      if (leaderboard == null) {
        continue;
      }
      // O(A) lookup using index instead of O(M*S) full scan
      leaderboard.infoByAnyFullName(candidateNames)
        .filter(info -> info.rank() != null && info.rank() > 0)
        .ifPresent(info -> {
          JsonObject entry = new JsonObject().put("role", role.name())
            .put("rank", info.rank())
            .put("score", info.totalScore());
          if (info.rankWithoutAlts() != null) {
            entry.put("rank_without_alts", info.rankWithoutAlts());
          }
          if (info.percentile() != null) {
            entry.put("percentile", info.percentile());
          }
          if (info.scoringTier() != null) {
            entry.put("scoring_tier", info.scoringTier());
          }
          summary.add(entry);
        });
    }
    return summary;
  }

  private void ladder(RoutingContext ctx, JsonPaged snapshot) {
    Long page = Optional.of(ctx.queryParam("page"))
      .flatMap(l -> l.stream().findFirst())
      .map(Long::parseLong)
      .orElse(1L);
    if (snapshot == null) {
      ctx.response().end(Snapshot.empty(EU).toJson(page).encode());
    } else {
      ctx.response().end(snapshot.toJson(page).encode());
    }
  }

  private Resp applySpecFilter(RoutingContext ctx, Resp specFiltered) {
    if (specFiltered == null) {
      return null;
    }
    List<String> specs = ctx.queryParam("specs").stream().flatMap(spcs -> Arrays.stream(spcs.split(","))).toList();
    if (specs.isEmpty()) {
      return specFiltered;
    } else {
      return (Resp) specFiltered.filter(specs);
    }
  }
}
