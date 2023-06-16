package io.github.sammers.pla;

import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.http.Http;
import io.github.sammers.pla.logic.Ladder;
import io.reactivex.Scheduler;
import io.reactivex.schedulers.Schedulers;
import io.vertx.core.json.JsonObject;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.ocpsoft.prettytime.PrettyTime;

import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import static java.time.format.DateTimeFormatter.ISO_DATE_TIME;

public class Main {

    public static final Executor VTHREAD_EXECUTOR = Executors.newVirtualThreadPerTaskExecutor();
    public static final Scheduler VTHREAD_SCHEDULER = Schedulers.from(VTHREAD_EXECUTOR);
    public static PrettyTime PRETTY_TIME = new PrettyTime(new Locale("en"));
    public static DateTimeFormatter DATA_TIME = ISO_DATE_TIME;

    public static void main(String[] args) {
        final Vertx vertx = Vertx.vertx();
        final WebClient webClient = WebClient.create(vertx);
        final String dbUri = System.getenv("DB_URI");
        final String clientId = System.getenv("CLIENT_ID");
        final String clientSecret = System.getenv("CLIENT_SECRET");
        final MongoClient mongoClient = MongoClient.createShared(vertx, new JsonObject()
            .put("db_name", "pvpq")
            .put("connection_string", dbUri)
            .put("maxPoolSize", 3)
        );
        final BlizzardAPI blizzardAPI = new BlizzardAPI(clientId, clientSecret, webClient);
        DB db = new DB(mongoClient);
        Ladder ladder = new Ladder(vertx, webClient, db, blizzardAPI);
        ladder.start();
        new Http(vertx, ladder).start();
    }
}