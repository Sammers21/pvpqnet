package io.github.sammers.pla.db;

import static io.github.sammers.pla.logic.Conts.*;
import static java.time.ZoneOffset.UTC;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.blizzard.Realm;
import io.github.sammers.pla.blizzard.Realms;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Flowable;
import io.reactivex.rxjava3.core.Maybe;
import io.reactivex.rxjava3.core.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.*;
import io.vertx.rxjava3.ext.mongo.MongoClient;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DB {
  private static final Logger log = LoggerFactory.getLogger(DB.class);
  private final MongoClient mongoClient;

  public DB(MongoClient mongoClient) {
    this.mongoClient = mongoClient;
  }

  /**
   * Creates all required indexes if they don't exist. Should be called once on
   * application startup.
   */
  public Completable ensureIndexes() {
    List<Completable> indexCreations = new ArrayList<>();
    // profile collection indexes
    indexCreations.add(createIndex("profile", new JsonObject().put("id", -1), "profile_id_idx"));
    indexCreations.add(createIndex("profile", new JsonObject().put("region", -1), "profile_region_idx"));
    // bracket collections: compound index on region + timestamp for efficient
    // queries
    List<String> brackets = List.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE, BLITZ);
    for (String bracket : brackets) {
      indexCreations.add(createIndex(bracket, new JsonObject().put("region", 1).put("timestamp", -1),
        bracket + "_region_timestamp_idx"));
    }
    // cutoffs collection: compound index on region + timestamp
    indexCreations.add(
      createIndex("cutoffs", new JsonObject().put("region", 1).put("timestamp", -1), "cutoffs_region_timestamp_idx"));
    // realm collection index
    indexCreations.add(createIndex("realm", new JsonObject().put("id", 1), "realm_id_idx"));
    // user collection indexes
    indexCreations.add(createIndex("user", new JsonObject().put("battlenet_id", 1), "user_battlenet_id_idx"));
    indexCreations.add(createIndex("user", new JsonObject().put("sessions.session_id", 1), "user_session_id_idx"));
    return Completable.merge(indexCreations)
      .doOnComplete(() -> log.info("All database indexes ensured"))
      .doOnError(err -> log.error("Error ensuring database indexes", err));
  }

  private Completable createIndex(String collection, JsonObject keys, String indexName) {
    long startTime = System.currentTimeMillis();
    String keysDesc = keys.encode();
    return mongoClient.listIndexes(collection).flatMapCompletable(indexes -> {
      boolean exists = false;
      for (Object o : indexes) {
        JsonObject index = (JsonObject) o;
        if (indexName.equals(index.getString("name"))) {
          exists = true;
          break;
        }
      }
      if (exists) {
        long elapsed = System.currentTimeMillis() - startTime;
        log.info("[Already Exist] Index {} on {} already exists, took {}ms to check, keys: {}", indexName, collection,
          elapsed, keysDesc);
        return Completable.complete();
      } else {
        return createIndexInternal(collection, keys, indexName, startTime, keysDesc);
      }
    }).onErrorResumeNext(err -> createIndexInternal(collection, keys, indexName, startTime, keysDesc));
  }

  private Completable createIndexInternal(String collection, JsonObject keys, String indexName, long startTime,
    String keysDesc) {
    IndexOptions options = new IndexOptions().name(indexName).background(true);
    return mongoClient.createIndexWithOptions(collection, keys, options).doOnComplete(() -> {
      long elapsed = System.currentTimeMillis() - startTime;
      log.info("[Created] Index {} on {} created in {}ms, keys: {}", indexName, collection, elapsed, keysDesc);
    }).doOnError(err -> {
      long elapsed = System.currentTimeMillis() - startTime;
      String msg = err.getMessage();
      if (msg != null && msg.contains("already exists")) {
        log.info("[Already Exist] Index {} on {} already exists, took {}ms to check, keys: {}", indexName, collection,
          elapsed, keysDesc);
      } else {
        log.error("Error creating index {} on {}: {}, took {}ms", indexName, collection, msg, elapsed);
      }
    }).onErrorComplete();
  }

  public Maybe<Snapshot> getLast(String bracket, String region) {
    return getLast(bracket, region, 0);
  }

  public Maybe<Snapshot> getLast(String bracket, String region, int skip) {
    FindOptions fopts = new FindOptions().setSort(new JsonObject().put("timestamp", -1)).setLimit(1).setSkip(skip);
    JsonObject opts = new JsonObject().put("region", new JsonObject().put("$eq", region));
    return find(bracket, fopts, opts);
  }

  /**
   * The idea is the following: we want snapshots to take less space, but we want
   * to keep the history of the snapshots. We want to keep one weekly snapshot
   * made on Friday for every week. Also, we keep all hourly snapshots for the
   * last 24 hours.
   */
  public Completable cleanBracketSnapshot(String bracket) {
    // find all snapshots timestamps first
    FindOptions findOptions = new FindOptions();
    findOptions.setFields(new JsonObject().put("timestamp", 1));
    findOptions.setSort(new JsonObject().put("timestamp", -1));
    return mongoClient.findWithOptions(bracket, new JsonObject(), findOptions).flatMapCompletable(found -> {
      Map<Long, JsonObject> notToDeleteSet = new HashMap<>();
      Map<Long, JsonObject> toDeleteSet = new HashMap<>();
      long now = System.currentTimeMillis();
      Instant nowInst = Instant.ofEpochMilli(now);
      Map<LocalDate, List<JsonObject>> dayToSnapshots = new HashMap<>();
      found.forEach(json -> {
        long timestamp = json.getLong("timestamp");
        Instant snapTime = Instant.ofEpochMilli(timestamp);
        Duration duration = Duration.between(snapTime, nowInst);
        if (duration.toHours() < 24) {
          // keep all snapshots for the last 24 hours
          notToDeleteSet.put(timestamp, json);
        }
        dayToSnapshots.computeIfAbsent(ZonedDateTime.ofInstant(snapTime, UTC).toLocalDate(), k -> new ArrayList<>())
          .add(json);
        // format snapTime to include the day of the week
        json.put("formatted", ZonedDateTime.ofInstant(snapTime, UTC).format(Main.DATA_TIME_WITH_WEEKDAY));
        json.put("local_date", ZonedDateTime.ofInstant(snapTime, UTC).toLocalDate().toString());
      });
      dayToSnapshots.forEach((day, snapshots) -> {
        if (Duration.between(day.atStartOfDay(), ZonedDateTime.ofInstant(nowInst, UTC)).toDays() < 7) {
          // keep minimal snapshot for every day of the last week
          snapshots.stream().min(Comparator.comparingLong(json -> json.getLong("timestamp"))).ifPresent(json -> {
            notToDeleteSet.put(json.getLong("timestamp"), json);
          });
        } else {
          // keep only THURSDAY snapshots for every week
          if (day.getDayOfWeek().equals(DayOfWeek.THURSDAY)) {
            snapshots.stream().min(Comparator.comparingLong(json -> json.getLong("timestamp"))).ifPresent(json -> {
              notToDeleteSet.put(json.getLong("timestamp"), json);
            });
          }
        }
      });
      // keep only notToDeleteSet
      found.forEach(json -> {
        long timestamp = json.getLong("timestamp");
        if (!notToDeleteSet.containsKey(timestamp)) {
          toDeleteSet.put(timestamp, json);
        }
      });
      return mongoClient
        .removeDocuments(bracket,
          new JsonObject().put("timestamp", new JsonObject().put("$in", new ArrayList<>(toDeleteSet.keySet()))))
        .doOnSuccess(res -> log.info("Deleted " + res.getRemovedCount() + " records " + bracket + " snapshots"))
        .ignoreElement();
    });
  }

  public Maybe<Snapshot> getMinsAgo(String bracket, String region, int mins) {
    long now = System.currentTimeMillis();
    long diff = mins * 60 * 1000L;
    long minsAgo = now - diff;
    FindOptions fopts = new FindOptions().setSort(new JsonObject().put("timestamp", 1)).setLimit(1);
    JsonObject opts = new JsonObject().put("timestamp", new JsonObject().put("$lt", now).put("$gt", minsAgo))
      .put("region", new JsonObject().put("$eq", region));
    return find(bracket, fopts, opts);
  }

  private Maybe<Snapshot> find(String bracket, FindOptions fopts, JsonObject opts) {
    return mongoClient.findWithOptions(bracket, opts, fopts).flatMapMaybe(res -> {
      List<Snapshot> snapshots = res.stream().map(Snapshot::fromJson).toList();
      if (!snapshots.isEmpty()) {
        return Maybe.just(snapshots.getFirst());
      } else {
        return Maybe.empty();
      }
    });
  }

  public Maybe<MongoClientBulkWriteResult> bulkUpdateChars(List<WowAPICharacter> characters) {
    if (characters.isEmpty()) {
      log.warn("Empty list of characters to update, skipping");
      return Maybe.empty();
    }
    List<BulkOperation> operations = characters.stream().map(character -> {
      BulkOperation op = BulkOperation.createUpdate(new JsonObject().put("id", character.id()),
        new JsonObject().put("$set", character.toJson()));
      op.setUpsert(true);
      return op;
    }).toList();
    AtomicLong tick = new AtomicLong(System.nanoTime());
    return mongoClient.bulkWrite("profile", operations)
      .doOnSubscribe(sub -> log.info("Start bulk update of {} characters", characters.size()))
      .doOnSuccess(res -> {
        long elapsed = System.nanoTime() - tick.get();
        log.info("Updated {} characters in {} ms", characters.size(), elapsed / 1000000);
      });
  }

  public Single<Optional<WowAPICharacter>> getCharacterById(long id) {
    return mongoClient.find("profile", new JsonObject().put("id", id)).map(list -> {
      if (list.isEmpty()) {
        return Optional.empty();
      }
      return Optional.of(WowAPICharacter.fromJson(list.getFirst()));
    });
  }

  public Single<List<WowAPICharacter>> getCharactersByIds(Set<Long> ids) {
    if (ids == null || ids.isEmpty()) {
      return Single.just(List.of());
    }
    JsonObject query = new JsonObject().put("id", new JsonObject().put("$in", new ArrayList<>(ids)));
    return mongoClient.find("profile", query).map(list -> list.stream().map(WowAPICharacter::fromJson).toList());
  }

  public Single<Optional<WowAPICharacter>> getCharacterByNameRealmRegion(String name, String realm, String region) {
    if (name == null || realm == null || region == null) {
      return Single.just(Optional.empty());
    }
    JsonObject query = new JsonObject().put("name", name).put("realm", realm).put("region", region);
    return mongoClient.find("profile", query).map(list -> {
      if (list.isEmpty()) {
        return Optional.empty();
      }
      return Optional.of(WowAPICharacter.fromJson(list.getFirst()));
    });
  }

  public Completable insertOnlyIfDifferent(String bracket, String region, Snapshot snapshot) {
    return mongoClient.save(bracket, snapshot.toJson())
      .doOnSuccess(ok -> log.info("Inserted data for {}-{}", region, bracket))
      .ignoreElement();
  }

  public Maybe<MongoClientUpdateResult> upsertCharacter(WowAPICharacter character) {
    return mongoClient
      .updateCollectionWithOptions("profile", new JsonObject().put("id", character.id()),
        new JsonObject().put("$set", character.toJson()), new UpdateOptions().setUpsert(true))
      .doOnSuccess(ok -> log.info("Upserted character: {}", character.fullName()))
      .doOnSubscribe(sub -> log.debug("Start upserting character: {}", character.fullName()))
      .doOnError(err -> log.error("Error upserting character: {}", character.fullName(), err));
  }

  public Completable deleteCharacterById(long id) {
    return mongoClient.removeDocuments("profile", new JsonObject().put("id", id)).ignoreElement();
  }

  public Maybe<MongoClientBulkWriteResult> bulkDeleteChars(List<Long> ids) {
    if (ids.isEmpty()) {
      log.warn("Empty list of character IDs to delete, skipping");
      return Maybe.empty();
    }
    List<BulkOperation> operations = ids.stream()
      .map(id -> BulkOperation.createDelete(new JsonObject().put("id", id)))
      .toList();
    AtomicLong tick = new AtomicLong(System.nanoTime());
    return mongoClient.bulkWrite("profile", operations)
      .doOnSubscribe(sub -> log.info("Start bulk delete of {} characters", ids.size()))
      .doOnSuccess(res -> {
        long elapsed = System.nanoTime() - tick.get();
        log.info("Deleted {} characters in {} ms", ids.size(), elapsed / 1000000);
      });
  }

  public Flowable<WowAPICharacter> fetchCharFlow(String region) {
    return mongoClient.findBatch("profile", new JsonObject().put("region", region))
      .toFlowable()
      .map(WowAPICharacter::fromJson);
  }

  public Completable insertRealms(Realms realms) {
    return mongoClient
      .bulkWrite("realm",
        realms.idToRealm()
          .values()
          .stream()
          .map(Realm::toJson)
          .map(json -> BulkOperation
            .createUpdate(new JsonObject().put("id", json.getInteger("id")), new JsonObject().put("$set", json))
            .setUpsert(true))
          .toList())
      .ignoreElement();
  }

  public Completable insertCutoffsIfDifferent(Cutoffs cutoffs) {
    return getLastCutoffs(cutoffs.region).flatMapCompletable(last -> {
      if (last.isEmpty() || !last.get().equals(cutoffs)) {
        return mongoClient.save("cutoffs", cutoffs.toJson())
          .doOnSuccess(ok -> log.info("Inserted cutoffs for region={} season={}", cutoffs.region, cutoffs.season))
          .ignoreElement();
      } else {
        log.info("Cutoffs for region={} season={} are the same, skipping", cutoffs.region, cutoffs.season);
        return Completable.complete();
      }
    });
  }

  public Single<Optional<Cutoffs>> getLastCutoffs(String region) {
    FindOptions fopts = new FindOptions().setSort(new JsonObject().put("timestamp", -1)).setLimit(1);
    JsonObject opts = new JsonObject().put("region", new JsonObject().put("$eq", region));
    return mongoClient.findWithOptions("cutoffs", opts, fopts).flatMap(res -> {
      List<Cutoffs> cutoffs = res.stream().map(Cutoffs::fromJson).toList();
      if (!cutoffs.isEmpty()) {
        return Single.just(Optional.of(cutoffs.getFirst()));
      } else {
        return Single.just(Optional.empty());
      }
    });
  }

  public Single<Realms> loadRealms() {
    return Single.defer(() -> {
      long tick = System.nanoTime();
      return mongoClient.find("realm", new JsonObject()).map(res -> {
        long elapsed = System.nanoTime() - tick;
        log.info("Loaded {} realms in {} ms", res.size(), elapsed / 1000000);
        return Realms.fromJson(res.stream().toList());
      });
    });
  }

  public Single<Optional<User>> getUser(long id) {
    return mongoClient.find("user", new JsonObject().put("battlenet_id", id)).map(list -> {
      if (list.isEmpty()) {
        return Optional.empty();
      }
      return Optional.of(User.fromJson(list.getFirst()));
    });
  }

  public Completable upsertUser(User user) {
    return mongoClient
      .replaceDocumentsWithOptions("user", new JsonObject().put("battlenet_id", user.battleNetInfo().id()),
        user.toJson(), new UpdateOptions().setUpsert(true))
      .ignoreElement();
  }

  public Single<Optional<User>> getUserBySession(String sessionId) {
    return mongoClient.find("user", new JsonObject().put("sessions.session_id", sessionId)).map(list -> {
      if (list.isEmpty()) {
        return Optional.empty();
      }
      return Optional.of(User.fromJson(list.getFirst()));
    });
  }

  public Completable invalidateExpired(User user) {
    boolean changed = false;
    List<PvPQNetSession> validSessions = new ArrayList<>();
    for (PvPQNetSession s : user.sessions()) {
      if (!s.isExpired()) {
        validSessions.add(s);
      } else {
        changed = true;
      }
    }
    Optional<BattleNetAccessToken> token = user.battleNetAccessToken();
    if (token.isPresent() && token.get().isExpired()) {
      token = Optional.empty();
      changed = true;
    }
    if (changed) {
      User cleanUser = new User(user.battleNetInfo(), user.characters(), token, validSessions);
      return upsertUser(cleanUser);
    }
    return Completable.complete();
  }
}
