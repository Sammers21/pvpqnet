package io.github.sammers.pla.http;

import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Meta;
import io.github.sammers.pla.logic.*;
import io.github.sammers.pla.db.Snapshot;
import io.reactivex.Single;
import io.vertx.core.VertxOptions;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.RoutingContext;
import io.vertx.reactivex.ext.web.handler.CorsHandler;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static io.github.sammers.pla.Main.VTHREAD_EXECUTOR;
import static io.github.sammers.pla.logic.Conts.*;


public class Http {
    private final Ladder ladder;
    private final Refs refs;
    private final CharacterCache characterCache;

    public Http(Ladder ladder, Refs refs, CharacterCache characterCache) {
        this.ladder = ladder;
        this.refs = refs;
        this.characterCache = characterCache;
    }

    public void start() {
        Vertx vertx = Vertx.vertx(new VertxOptions().setEventLoopPoolSize(4));
        Router router = Router.router(vertx);
        router.route().handler(CorsHandler.create());
        router.routeWithRegex(".*main.js").handler(ctx -> ctx.response().sendFile("main.js"));
        router.routeWithRegex(".*main.css").handler(ctx -> ctx.response().sendFile("main.css"));
        router.routeWithRegex(".*df.img").handler(ctx -> ctx.response().sendFile("df.img"));
        router.routeWithRegex(".*gladicon.webp").handler(ctx -> ctx.response().sendFile("gladicon.webp"));
        router.routeWithRegex(("\\/classicons\\/(?<classicon>[^\\/]+.png)")).handler(ctx -> ctx.response().sendFile("classicons/" + ctx.pathParam("classicon")));
        router.routeWithRegex(("\\/specicons\\/(?<specicon>[^\\/]+.png)")).handler(ctx -> ctx.response().sendFile("specicons/" + ctx.pathParam("specicon")));
        router.routeWithRegex(("\\/regionicons\\/(?<regionicon>[^\\/]+.svg)")).handler(ctx -> ctx.response().sendFile("regionicons/" + ctx.pathParam("regionicon")));
        router.get("/api/search").handler(ctx -> {
            VTHREAD_EXECUTOR.execute(() -> {
                Optional<String> q = Optional.ofNullable(ctx.request().getParam("q"));
                Optional<String> query = Optional.ofNullable(ctx.request().getParam("query"));
                Optional<String> opt = Stream.of(q, query).filter(Optional::isPresent).map(Optional::get).map(String::toLowerCase).findFirst();
                ctx.response().putHeader("Content-Type", "application/json");
                if (opt.isEmpty()) {
                    ctx.response().end(new JsonArray().encode());
                } else {
                    ctx.response().end(new JsonArray(ladder.search(opt.get()).stream().map(SearchResult::toJson).toList()).encode());
                }
            });
        });
        router.get("/api/meta").handler(ctx -> {
            VTHREAD_EXECUTOR.execute(() -> {
                // Params example: {region: 'eu', bracket: 'shuffle', period: 'this_season', role: 'all'}
                ctx.response().putHeader("Content-Type", "application/json");
                String bracket = Optional.ofNullable(ctx.request().getParam("bracket")).orElse(THREE_V_THREE);
                String region = Optional.ofNullable(ctx.request().getParam("region")).orElse("eu");
                String role = Optional.ofNullable(ctx.request().getParam("role")).orElse("dps");
                String period = Optional.ofNullable(ctx.request().getParam("period")).orElse("this_season");
                ctx.response().end(Optional.ofNullable(ladder.metaRef(bracket, region, role, period).get()).map(Meta::toJson).orElse(new JsonObject()).encode());
            });
        });
        router.get("/api/:region/ladder/:bracket").handler(ctx -> {
            VTHREAD_EXECUTOR.execute(() -> {
                String region = ctx.pathParam("region");
                String bracket = ctx.pathParam("bracket");
                if (bracket.equals("rbg")) {
                    bracket = RBG;
                }
                Snapshot snapshot = refs.refByBracket(bracket, region).get();
                if (snapshot == null) {
                    ctx.response().end(Snapshot.empty(region).toJson().encode());
                } else {
                    ladder(ctx, applySpecFilter(ctx, snapshot
                            .applyCutoffs(bracket, ladder.regionCutoff.get(region))
                            .applySlugToName(ladder.realms.get()))
                    );
                }
            });
        });
        router.get("/api/:region/activity/stats").handler(ctx -> {
            VTHREAD_EXECUTOR.execute(() -> {
                String region = ctx.pathParam("region");
                Integer twos = Optional.ofNullable(refs.diffsByBracket(TWO_V_TWO, region).get()).map(diff -> diff.chars().size()).orElse(0);
                Integer threes = Optional.ofNullable(refs.diffsByBracket(THREE_V_THREE, region).get()).map(diff -> diff.chars().size()).orElse(0);
                Integer rbgs = Optional.ofNullable(refs.diffsByBracket(RBG, region).get()).map(diff -> diff.chars().size()).orElse(0);
                Integer shuffle = Optional.ofNullable(refs.diffsByBracket(SHUFFLE, region).get()).map(diff -> diff.chars().size()).orElse(0);
                JsonObject res = new JsonObject().put("2v2", twos).put("3v3", threes).put("rbg", rbgs).put("shuffle", shuffle);
                Cutoffs cutoffs = ladder.regionCutoff.get(region);
                if (ladder.regionCutoff.get(region) != null) {
                    res.put("cutoffs", cutoffs.toJson());
                }
                ctx.response().end(res.encode());
            });
        });
        router.get("/api/:region/activity/:bracket").handler(ctx -> {
            VTHREAD_EXECUTOR.execute(() -> {
                String region = ctx.pathParam("region");
                String bracket = ctx.pathParam("bracket");
                if (bracket.equals("rbg")) {
                    bracket = RBG;
                }
                SnapshotDiff snapshotDiff = refs.diffsByBracket(bracket, region).get();
                if (snapshotDiff == null) {
                    ctx.response().end(Snapshot.empty(region).toJson().encode());
                } else {
                    ladder(ctx, applySpecFilter(ctx, snapshotDiff
                            .applyCutoffs(bracket, ladder.regionCutoff.get(region))
                            .applySlugToName(ladder.realms.get()))
                    );
                }
            });
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
                String region = ctx.pathParam("region");
                String realm = ctx.pathParam("realm");
                String name = ctx.pathParam("name");
                ladder.charUpdater.updateChar(region, Character.fullNameByRealmAndName(name, realm))
                    .andThen(Single.fromCallable(() -> ladder.wowChar(realm, name)))
                    .subscribe(wowAPICharacter -> {
                        if (wowAPICharacter.isEmpty() || wowAPICharacter.get().hidden()) {
                            ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Character not found").encode());
                        } else {
                            ctx.response().end(wowCharToJson(wowAPICharacter.get()).encode());
                        }
                    }, err -> nameRealmLookupResponse(ctx, realm, name));
            });
        });
        router.get("/:region/ladder/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/:region/activity/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/ladder/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/activity/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/").handler(ctx -> ctx.response().sendFile("index.html"));
        vertx.createHttpServer().requestHandler(router).listen(9000);
    }

    private void nameRealmLookupResponse(RoutingContext ctx, String realm, String name) {
        Optional<WowAPICharacter> charWithName = ladder.wowChar(ladder.realms.get().nameToSlug(realm), name);
        Optional<WowAPICharacter> charWithSlug = ladder.wowChar(realm, name);
        Optional<WowAPICharacter> res = Stream.of(charWithName, charWithSlug).filter(Optional::isPresent).findFirst().map(Optional::get);
        if (res.isEmpty() || res.get().hidden()) {
            ctx.response().setStatusCode(404).end(new JsonObject().put("error", "Character not found").encode());
        } else {
            ctx.response().end(wowCharToJson(res.get()).encode());
        }
    }

    private JsonObject wowCharToJson(WowAPICharacter character) {
        Set<WowAPICharacter> alts = characterCache.altsFor(character);
        JsonObject res = character.toJson();
        if (alts != null) {
            res.put("alts", new JsonArray(alts.stream().filter(c -> c.id() != character.id()).map(WowAPICharacter::toJson).toList()));
        } else {
            res.put("alts", new JsonArray());
        }
        return res;
    }

    private void ladder(RoutingContext ctx, JsonPaged snapshot) {
        Long page = Optional.of(ctx.queryParam("page")).flatMap(l -> l.stream().findFirst()).map(Long::parseLong).orElse(1L);
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
