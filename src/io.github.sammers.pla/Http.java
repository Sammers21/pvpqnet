package io.github.sammers.pla;

import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.RoutingContext;

import java.util.List;
import java.util.Optional;

import static io.github.sammers.pla.Ladder.*;

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
        router.routeWithRegex(".*main.js").handler(ctx -> ctx.response().sendFile("main.js"));
        router.routeWithRegex(".*main.css").handler(ctx -> ctx.response().sendFile("main.css"));
        router.routeWithRegex(".*df.img").handler(ctx -> ctx.response().sendFile("df.img"));
        router.routeWithRegex(("\\/classicons\\/(?<classicon>[^\\/]+.png)")).handler(ctx -> ctx.response().sendFile("classicons/" + ctx.pathParam("classicon")));
        router.routeWithRegex(("\\/specicons\\/(?<specicon>[^\\/]+.png)")).handler(ctx -> ctx.response().sendFile("specicons/" + ctx.pathParam("specicon")));
        router.routeWithRegex(("\\/regionicons\\/(?<regionicon>[^\\/]+.svg)")).handler(ctx -> ctx.response().sendFile("regionicons/" + ctx.pathParam("regionicon")));
        router.get("/api/:region/ladder/:bracket").handler(ctx -> {
            String region = ctx.pathParam("region");
            String bracket = ctx.pathParam("bracket");
            if (bracket.equals("rbg")) {
                bracket = RBG;
            }
            ladder(ctx, ladder.refByBracket(bracket, region).get());
        });
        router.get("/api/:region/activity/:bracket").handler(ctx -> {
            String region = ctx.pathParam("region");
            String bracket = ctx.pathParam("bracket");
            if (bracket.equals("rbg")) {
                bracket = RBG;
            }
            ladder(ctx, ladder.diffsByBracket(bracket, region).get());
        });
        router.get("/:region/ladder/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/:region/activity/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/ladder/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/activity/:bracket").handler(ctx -> ctx.response().sendFile("index.html"));
        router.get("/").handler(ctx -> ctx.response().sendFile("index.html"));
        vertx.createHttpServer().requestHandler(router).listen(9000);
    }

    private void ladder(RoutingContext ctx, JsonPaged snapshot) {
        Long page = Optional.of(ctx.queryParam("page"))
            .flatMap(l -> l.stream().findFirst())
            .map(Long::parseLong).orElse(1L);
        if (snapshot == null) {
            ctx.response().end(Snapshot.empty(EU).toJson(page).encode());
        } else {
            ctx.response().end(snapshot.toJson(page).encode());
        }
    }
}
