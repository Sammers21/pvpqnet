package io.github.sammers.pla;

import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.Router;
import io.vertx.reactivex.ext.web.RoutingContext;

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
        router.get("/ladder/2v2").handler(ctx -> ladder(ctx, ladder.twoVTwoladder.get()));
        router.get("/ladder/3v3").handler(ctx -> ladder(ctx, ladder.threeVThreeLadder.get()));
        router.get("/ladder/shuffle").handler(ctx -> ladder(ctx, ladder.shuffleLadder.get()));
        router.get("/ladder/rbg").handler(ctx -> ladder(ctx, ladder.shuffleLadder.get()));
        router.get("/activity/2v2").handler(ctx -> ctx.response().end("Hello from Vert.x!"));
        router.get("/activity/3v3").handler(ctx -> ctx.response().end("Hello from Vert.x!"));
        router.get("/activity/shuffle").handler(ctx -> ctx.response().end("Hello from Vert.x!"));
        router.get("/activity/rbg").handler(ctx -> ctx.response().end("Hello from Vert.x!"));
        vertx.createHttpServer().requestHandler(router).listen(9000);
    }

    private void ladder(RoutingContext ctx, Snapshot snapshot) {
        Long page = Optional.of(ctx.queryParam("page"))
                .flatMap(l -> l.stream().findFirst())
                .map(Long::parseLong).orElse(1L);
        if (snapshot == null) {
            ctx.response().end("No data");
        } else {
            ctx.response().end(snapshot.toJson(page).encode());
        }
    }

}
