package io.github.sammers.pla;

import io.reactivex.Maybe;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.ocpsoft.prettytime.PrettyTime;

import java.util.Date;
import java.util.Locale;

public class Main {
    public static PrettyTime PRETTY_TIME = new PrettyTime(new Locale("en"));

    public static void main(String[] args) {
        Vertx vertx = Vertx.vertx();
        WebClient webClient = WebClient.create(vertx);
        final String dbUri = System.getenv("DB_URI");
        MongoClient mongoClient = MongoClient.createShared(vertx, new JsonObject()
                .put("db_name", "pvpq")
                .put("connection_string", dbUri)
        );
        DB db = new DB(mongoClient);
        Ladder ladder = new Ladder(vertx, webClient, db);
        ladder.start();
        new Http(vertx, ladder).start();
    }
}