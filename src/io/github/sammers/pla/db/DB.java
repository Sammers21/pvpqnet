package io.github.sammers.pla.db;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.blizzard.Realm;
import io.github.sammers.pla.blizzard.Realms;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.reactivex.Completable;
import io.reactivex.Flowable;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.*;
import io.vertx.reactivex.ext.mongo.MongoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static java.time.ZoneOffset.UTC;

public class DB {
    private static final Logger log = LoggerFactory.getLogger(DB.class);

    private final MongoClient mongoClient;

    public DB(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    public Maybe<Snapshot> getLast(String bracket, String region) {
        return getLast(bracket, region, 0);
    }

    public Maybe<Snapshot> getLast(String bracket, String region, int skip) {
        FindOptions fopts = new FindOptions()
            .setSort(new JsonObject().put("timestamp", -1))
            .setLimit(1).setSkip(skip);
        JsonObject opts = new JsonObject()
            .put("region", new JsonObject().put("$eq", region));
        return find(bracket, fopts, opts);
    }

    /**
     * The idea is the following: we want snapshots to take less space, but we want to keep the history of the snapshots.
     * We want to keep one weekly snapshot made on Friday for every week. Also, we keep all hourly snapshots for the last 24 hours.
     */
    public Completable cleanBracketSnapshot(String bracket) {
        // find all snapshots timestamps first
        FindOptions findOptions = new FindOptions();
        findOptions.setFields(new JsonObject().put("timestamp", 1));
        findOptions.setSort(new JsonObject().put("timestamp", -1));
        return mongoClient.rxFindWithOptions(bracket, new JsonObject(), findOptions).flatMapCompletable(found -> {
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
                dayToSnapshots.computeIfAbsent(ZonedDateTime.ofInstant(snapTime, UTC).toLocalDate(), k -> new ArrayList<>()).add(json);

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
            return mongoClient.rxRemoveDocuments(bracket, new JsonObject().put("timestamp", new JsonObject().put("$in", new ArrayList<>(toDeleteSet.keySet()))))
                .doOnSuccess(res -> log.info("Deleted " + res.getRemovedCount() + " records " + bracket + " snapshots"))
                .ignoreElement();
        });
    }

    public Maybe<Snapshot> getMinsAgo(String bracket, String region, int mins) {
        long now = System.currentTimeMillis();
        long diff = mins * 60 * 1000L;
        long minsAgo = now - diff;
        FindOptions fopts = new FindOptions().setSort(new JsonObject().put("timestamp", 1)).setLimit(1);
        JsonObject opts = new JsonObject()
            .put("timestamp", new JsonObject().put("$lt", now).put("$gt", minsAgo))
            .put("region", new JsonObject().put("$eq", region));
        return find(bracket, fopts, opts);
    }

    private Maybe<Snapshot> find(String bracket, FindOptions fopts, JsonObject opts) {
        return mongoClient.rxFindWithOptions(bracket, opts, fopts).flatMapMaybe(res -> {
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
        List<BulkOperation> operations = characters.stream()
            .map(character -> {
                    BulkOperation op = BulkOperation.createUpdate(
                        new JsonObject().put("id", character.id()),
                        new JsonObject().put("$set", character.toJson())
                    );
                    op.setUpsert(true);
                    return op;
                }
            ).toList();
        AtomicLong tick = new AtomicLong(System.nanoTime());
        return mongoClient.rxBulkWrite("profile", operations)
                .doOnSubscribe(sub -> log.info("Start bulk update of {} characters", characters.size()))
                .doOnSuccess(res -> {
                    long elapsed = System.nanoTime() - tick.get();
                    log.info("Updated {} characters in {} ms", characters.size(), elapsed / 1000000);
                });
    }

    public Completable insertOnlyIfDifferent(String bracket, String region, Snapshot snapshot) {
        return mongoClient.rxSave(bracket, snapshot.toJson())
            .doOnSuccess(ok -> log.info("Inserted data for {}-{}", region, bracket))
            .ignoreElement();
    }

    public Maybe<MongoClientUpdateResult> upsertCharacter(WowAPICharacter character) {
        return mongoClient.rxUpdateCollectionWithOptions("profile",
            new JsonObject().put("id", character.id()),
            new JsonObject().put("$set", character.toJson()),
            new UpdateOptions().setUpsert(true)
        ).doOnSuccess(ok -> log.info("Upserted character: {}", character.fullName()))
            .doOnSubscribe(sub -> log.debug("Start upserting character: {}", character.fullName()))
            .doOnError(err -> log.error("Error upserting character: {}", character.fullName(), err));
    }

    public Single<List<WowAPICharacter>> fetchChars(String region) {
        long tick = System.nanoTime();
        return mongoClient.rxFind("profile", new JsonObject().put("region", region))
            .map(res -> res.stream().map(WowAPICharacter::fromJson).toList())
            .doOnSuccess(chars -> {
                long elapsed = System.nanoTime() - tick;
                log.info("Fetched {} characters region {} in {} ms", chars.size(), region, elapsed / 1000000);
            })
            .subscribeOn(Main.VTHREAD_SCHEDULER)
            .observeOn(Main.VTHREAD_SCHEDULER);
    }

    public Flowable<WowAPICharacter> fetchCharFlow(String region) {
        return mongoClient.findBatch("profile", new JsonObject().put("region", region))
            .toFlowable()
            .map(WowAPICharacter::fromJson);
    }

    public Completable insertRealms(Realms realms) {
        return mongoClient.rxBulkWrite("realm", realms.idToRealm().values().stream()
            .map(Realm::toJson)
            .map(json -> BulkOperation.createUpdate(
                new JsonObject().put("id", json.getInteger("id")),
                new JsonObject().put("$set", json)
            ).setUpsert(true))
            .toList()
        ).ignoreElement();
    }

    public Completable insertCutoffsIfDifferent(Cutoffs cutoffs) {
        return getLastCutoffs(cutoffs.region).flatMapCompletable(last -> {
            if (last.isEmpty() || !last.get().equals(cutoffs)) {
                return mongoClient.rxSave("cutoffs", cutoffs.toJson())
                    .doOnSuccess(ok -> log.info("Inserted cutoffs for region={} season={}", cutoffs.region, cutoffs.season))
                    .ignoreElement();
            } else {
                log.info("Cutoffs for region={} season={} are the same, skipping", cutoffs.region, cutoffs.season);
                return Completable.complete();
            }
        });
    }

    public Single<Optional<Cutoffs>> getLastCutoffs(String region) {
        FindOptions fopts = new FindOptions()
            .setSort(new JsonObject().put("timestamp", -1))
            .setLimit(1);
        JsonObject opts = new JsonObject()
            .put("region", new JsonObject().put("$eq", region));
        return mongoClient.rxFindWithOptions("cutoffs", opts, fopts).flatMap(res -> {
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
                return mongoClient.rxFind("realm", new JsonObject())
                    .map(res -> {
                        long elapsed = System.nanoTime() - tick;
                        log.info("Loaded {} realms in {} ms", res.size(), elapsed / 1000000);
                        return Realms.fromJson(res.stream().toList());
                    });
            });
    }
}
