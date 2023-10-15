package io.github.sammers.pla.db;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.reactivex.Completable;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.*;
import io.vertx.reactivex.ext.mongo.MongoClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Date;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

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
}
