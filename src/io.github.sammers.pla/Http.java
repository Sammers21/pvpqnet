package io.github.sammers.pla;

import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.RoutingContext;

import java.util.List;
import java.util.Optional;

public class Http {

    private final Vertx vertx;
    private final Ladder ladder;

    public Http(Vertx vertx, Ladder ladder) {
        this.vertx = vertx;
        this.ladder = ladder;
    }

    public void start() {
        Vertx vertx = Vertx.vertx();
        Router router = Router.router(vertx);
        router.route().handler(ctx -> {
            ctx.response()
                .putHeader("Access-Control-Allow-Origin", "*")
                .putHeader("Access-Control-Allow-Credentials", "true")
                .putHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                .putHeader("Access-Control-Max-Age", "86400");
            if (!(ctx.request().path().contains("df.img") || ctx.request().path().contains(".png"))) {
                ctx.response().putHeader("Cache-Control", "no-cache, no-store, must-revalidate");
            }
            ctx.next();
        });
        router.get("/api/ladder/2v2").handler(ctx -> ladder(ctx, ladder.refByBracket(Ladder.TWO_V_TWO).get()));
        router.get("/api/ladder/3v3").handler(ctx -> ladder(ctx, ladder.refByBracket(Ladder.THREE_V_THREE).get()));
        router.get("/api/ladder/shuffle").handler(ctx -> ladder(ctx, ladder.refByBracket(Ladder.SHUFFLE).get()));
        router.get("/api/ladder/rbg").handler(ctx -> ladder(ctx, ladder.refByBracket(Ladder.RBG).get()));
        router.get("/api/activity/2v2").handler(ctx -> ladder(ctx, ladder.diffsByBracket(Ladder.TWO_V_TWO).get()));
        router.get("/api/activity/3v3").handler(ctx -> ladder(ctx, ladder.diffsByBracket(Ladder.THREE_V_THREE).get()));
        router.get("/api/activity/shuffle").handler(ctx -> ladder(ctx, ladder.diffsByBracket(Ladder.SHUFFLE).get()));
        router.get("/api/activity/rbg").handler(ctx -> ladder(ctx, ladder.diffsByBracket(Ladder.RBG).get()));
        router.routeWithRegex(".*main.js").handler(ctx -> ctx.response().sendFile("main.js"));
        router.routeWithRegex(".*main.css").handler(ctx -> ctx.response().sendFile("main.css"));
        router.routeWithRegex(".*df.img").handler(ctx -> ctx.response().sendFile("df.img"));
        router.routeWithRegex(("\\/classicons\\/(?<classicon>[^\\/]+.png)")).handler(ctx -> ctx.response().sendFile("classicons/" + ctx.pathParam("classicon")));
        router.routeWithRegex(("\\/specicons\\/(?<specicon>[^\\/]+.png)")).handler(ctx -> ctx.response().sendFile("specicons/" + ctx.pathParam("specicon")));
        router.routeWithRegex(("\\/regionicons\\/(?<regionicon>[^\\/]+.svg)")).handler(ctx -> ctx.response().sendFile("regionicons/" + ctx.pathParam("regionicon")));
        router.get("/").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/activity/2v2").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/activity/3v3").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/activity/shuffle").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/activity/rbg").handler(ctx -> ctx.response().sendFile("index.html"));
        vertx.createHttpServer().requestHandler(router).listen(9000);
    }

    private void ladder(RoutingContext ctx, JsonPaged snapshot) {
        Long page = Optional.of(ctx.queryParam("page"))
            .flatMap(l -> l.stream().findFirst())
            .map(Long::parseLong).orElse(1L);
        if (snapshot == null) {
            ctx.response().end(new Snapshot(List.of(), System.currentTimeMillis()).toJson(page).encode());
        } else {
            ctx.response().end(snapshot.toJson(page).encode());
        }
    }
}
