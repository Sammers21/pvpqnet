package io.github.sammers.pla;

import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.ExtCharacterSearcher;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.http.Http;
import io.github.sammers.pla.logic.CharacterCache;
import io.github.sammers.pla.logic.Ladder;
import io.github.sammers.pla.logic.Refs;
import io.reactivex.Scheduler;
import io.reactivex.plugins.RxJavaPlugins;
import io.reactivex.schedulers.Schedulers;
import io.vertx.core.VertxOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.web.client.WebClientOptions;
import io.vertx.reactivex.core.RxHelper;
import io.vertx.reactivex.core.Vertx;
import io.vertx.reactivex.ext.mongo.MongoClient;
import io.vertx.reactivex.ext.web.client.WebClient;
import org.ocpsoft.prettytime.PrettyTime;

import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static java.time.format.DateTimeFormatter.ISO_DATE_TIME;

public class Main {

    public static final Executor VTHREAD_EXECUTOR = Executors.newVirtualThreadPerTaskExecutor();
    public static final Scheduler VTHREAD_SCHEDULER = Schedulers.from(VTHREAD_EXECUTOR);
    public static PrettyTime PRETTY_TIME = new PrettyTime(new Locale("en"));
    public static DateTimeFormatter DATA_TIME = ISO_DATE_TIME;
    public static DateTimeFormatter DATA_TIME_WITH_WEEKDAY = new DateTimeFormatterBuilder()
        .appendPattern("EEEE, ")
        .append(ISO_DATE_TIME)
        .toFormatter();

    public static void main(String[] args) {
        final Vertx vertx = Vertx.vertx(new VertxOptions()
                .setBlockedThreadCheckInterval(10)
                .setBlockedThreadCheckIntervalUnit(TimeUnit.SECONDS)
                .setWarningExceptionTime(10)
                .setWarningExceptionTimeUnit(TimeUnit.SECONDS)
                .setMaxEventLoopExecuteTime(10)
                .setMaxEventLoopExecuteTimeUnit(TimeUnit.SECONDS)
                .setEventLoopPoolSize(32)
        );
        RxJavaPlugins.setComputationSchedulerHandler(s -> RxHelper.scheduler(vertx));
        RxJavaPlugins.setIoSchedulerHandler(s -> RxHelper.blockingScheduler(vertx));
        RxJavaPlugins.setNewThreadSchedulerHandler(s -> RxHelper.scheduler(vertx));
        final WebClient webClient = WebClient.create(vertx,
          new WebClientOptions().setMaxPoolSize(100)
        );
        final String dbUri = System.getenv("DB_URI");
        final String clientId = System.getenv("CLIENT_ID");
        final String clientSecret = System.getenv("CLIENT_SECRET");
        final MongoClient mongoClient = MongoClient.createShared(vertx, new JsonObject()
            .put("db_name", "pvpq")
            .put("connection_string", dbUri)
            .put("maxPoolSize", 10)
        );
        final CharacterCache characterCache = new CharacterCache();
        final Refs refs = new Refs();
        final Map<String, Cutoffs> cutoffsMap = new ConcurrentHashMap<>();
        final ExtCharacterSearcher checkPvPFrAPI = new ExtCharacterSearcher(webClient);
        final BlizzardAPI blizzardAPI = new BlizzardAPI(clientId, clientSecret, webClient, refs, characterCache, cutoffsMap);
        DB db = new DB(mongoClient);
        Ladder ladder = new Ladder(webClient, db, blizzardAPI, characterCache, refs, cutoffsMap);
        ladder.start();
        new Http(ladder, refs, characterCache, checkPvPFrAPI).start();
    }
}
