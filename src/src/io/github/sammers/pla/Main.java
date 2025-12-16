package io.github.sammers.pla;

import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.config.AppConfig;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.http.Http;
import io.github.sammers.pla.logic.*;
import io.prometheus.metrics.core.metrics.Counter;
import io.prometheus.metrics.core.metrics.Gauge;
import io.prometheus.metrics.exporter.httpserver.HTTPServer;
import io.prometheus.metrics.instrumentation.jvm.JvmMetrics;
import io.reactivex.rxjava3.core.Scheduler;
import io.reactivex.rxjava3.plugins.RxJavaPlugins;
import io.reactivex.rxjava3.schedulers.Schedulers;
import io.vertx.core.VertxOptions;
import io.vertx.core.json.JsonObject;
import io.vertx.core.http.HttpClientOptions;
import io.vertx.rxjava3.core.RxHelper;
import io.vertx.rxjava3.core.Vertx;
import io.vertx.rxjava3.ext.mongo.MongoClient;
import io.vertx.rxjava3.ext.web.client.WebClient;
import org.ocpsoft.prettytime.PrettyTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
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
  private static final Logger log = LoggerFactory.getLogger(Main.class);
  private static final Executor RAW_VTHREAD_EXECUTOR = Executors.newVirtualThreadPerTaskExecutor();
  public static final Executor VTHREAD_EXECUTOR = task -> RAW_VTHREAD_EXECUTOR.execute(() -> {
    try {
      task.run();
    } catch (Throwable t) {
      log.error("Uncaught exception in virtual thread", t);
    }
  });
  public static final Scheduler VTHREAD_SCHEDULER = Schedulers.from(VTHREAD_EXECUTOR);
  public static PrettyTime PRETTY_TIME = new PrettyTime(Locale.ENGLISH);
  public static DateTimeFormatter DATA_TIME = ISO_DATE_TIME;
  public static DateTimeFormatter DATA_TIME_WITH_WEEKDAY = new DateTimeFormatterBuilder().appendPattern("EEEE, ")
    .append(ISO_DATE_TIME)
    .toFormatter();

  public static void main(String[] args) throws IOException {
    final AppConfig.Loaded loadedConfig = AppConfig.loadWithSource(args);
    final AppConfig config = loadedConfig.config();
    log.info("Loaded config from {}", loadedConfig.path().toAbsolutePath());
    log.info("Config {}", config);
    JvmMetrics.builder().register();
    HTTPServer.builder().port(9400).buildAndStart();
    log.info("Starting Metrics server on port 9400");
    final Vertx vertx = Vertx.vertx(new VertxOptions().setBlockedThreadCheckInterval(10)
      .setBlockedThreadCheckIntervalUnit(TimeUnit.SECONDS)
      .setWarningExceptionTime(10)
      .setWarningExceptionTimeUnit(TimeUnit.SECONDS)
      .setMaxEventLoopExecuteTime(10)
      .setMaxEventLoopExecuteTimeUnit(TimeUnit.SECONDS)
      .setEventLoopPoolSize(32));
    RxJavaPlugins.setComputationSchedulerHandler(s -> RxHelper.scheduler(vertx));
    RxJavaPlugins.setIoSchedulerHandler(s -> RxHelper.blockingScheduler(vertx));
    RxJavaPlugins.setNewThreadSchedulerHandler(s -> RxHelper.scheduler(vertx));
    final WebClient webClient = WebClient.wrap(vertx.createHttpClient(new HttpClientOptions()));
    final String dbUri = config.dbUri();
    final String clientId = config.clientId();
    final String clientSecret = config.clientSecret();
    final String indexerClientId = config.indexerClientId();
    final String indexerClientSecret = config.indexerClientSecret();
    final String callbackUrl = config.callback();
    final MongoClient mongoClient = MongoClient.createShared(vertx,
      new JsonObject().put("db_name", "pvpq").put("connection_string", dbUri).put("maxPoolSize", 10));
    final CharacterCache characterCache = new CharacterCache();
    final Refs refs = new Refs();
    final Map<String, Cutoffs> cutoffsMap = new ConcurrentHashMap<>();
    Gauge permitsMetric = Gauge.builder()
      .name("RateLimiterPermits")
      .help("How many permits are left in the rate limiter")
      .labelNames("name")
      .register();
    Counter rqCounter = Counter.builder()
      .name("BlizzardAPIRequests")
      .labelNames("type", "key")
      .help("Blizzard API requests counter")
      .register();
    Counter rlAcquiredCounter = Counter.builder()
      .name("RateLimiterAcquired")
      .labelNames("name")
      .help("Total acquired permits in rate limiters")
      .register();
    final BlizzardAPI blizzardAPI = new BlizzardAPI(vertx, permitsMetric, rlAcquiredCounter, rqCounter, "main",
      clientId, clientSecret, callbackUrl, webClient, refs, characterCache, cutoffsMap, true);
    final BlizzardAPI indexerBlizzardAPI = new BlizzardAPI(vertx, permitsMetric, rlAcquiredCounter, rqCounter,
      "indexer", indexerClientId, indexerClientSecret, callbackUrl, webClient, refs, characterCache, cutoffsMap, false);
    DB db = new DB(mongoClient);
    db.ensureIndexes().subscribe();
    NickNameSearchIndex idx = new NickNameSearchIndex();
    CharUpdater updater = new CharUpdater(blizzardAPI, indexerBlizzardAPI, characterCache, refs, idx, db);
    UserLogic userLogic = new UserLogic(blizzardAPI, characterCache, db, updater);
    Ladder ladder = new Ladder(webClient, db, blizzardAPI, indexerBlizzardAPI, characterCache, refs, cutoffsMap,
      updater, idx);
    ladder.start();
    new Http(vertx, ladder, refs, characterCache, userLogic, db).start();
  }
}
