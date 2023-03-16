package io.github.sammers.pla;

import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.client.WebClient;

public class Main {
    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        WebClient webClient = WebClient.create(vertx);
        Ladder ladder = new Ladder(vertx, webClient);
        ladder.start();
        MongoClient.createShared(vertx, new JsonObject()
                .put("db_name", "pvpq")
                .put("connection_string", "mongodb://localhost:27017")
        );
        new Http(vertx, ladder).start();
    }
}
