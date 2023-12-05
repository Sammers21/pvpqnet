package io.github.sammers.pla.db;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.Realm;
import io.github.sammers.pla.blizzard.Realms;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.reactivex.Completable;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.*;
import io.vertx.reactivex.ext.mongo.MongoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
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

    public Maybe<MongoClientDeleteResult> deleteOlderThanHours(String bracket, int hours) {
        return mongoClient.rxRemoveDocuments(bracket,
            new JsonObject().put("timestamp", new JsonObject().put("$lt", new Date().getTime() - (long) hours * 60 * 60 * 1000))
        ).doOnSuccess(res -> log.info("Deleted " + res.getRemovedCount() + " records " + bracket + " snapshots"));
    }

    /**
     * The idea is the following: we want snapshots to take less space, but we want to keep the history of the snapshots.
     * We want to keep one weekly snapshot made on Friday for every week. Also, we keep all hourly snapshots for the last 24 hours.
     */
    public Completable cleanBracketSnapshot(String bracket) {
        // find all snapshots timestamps first
        FindOptions findOptions = new FindOptions();
        findOptions.setFields(new JsonObject().put("timestamp", 1));
        findOptions.setSort(new JsonObject().put("timestamp", 1));
        return mongoClient.rxFindWithOptions(bracket, new JsonObject(), findOptions).flatMapCompletable(found -> {
            List<JsonObject> notToDelete = new ArrayList<>();
            List<JsonObject> toDelete = new ArrayList<>();
            long now = System.currentTimeMillis();
            Instant nowInst = Instant.ofEpochMilli(now);
            found.forEach(json -> {
                long timestamp = json.getLong("timestamp");
                Instant snapTime= Instant.ofEpochMilli(timestamp);
                Duration duration = Duration.between(snapTime, nowInst);
                duration.toMinutes();
                json.put("duration", duration.toMinutes() + " minutes ago");
            });
           return Completable.complete();
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
            if (snapshots.size() > 0) {
                return Maybe.just(snapshots.get(0));
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
