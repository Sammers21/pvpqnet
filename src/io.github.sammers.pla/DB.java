package io.github.sammers.pla;

import io.reactivex.Completable;
import io.reactivex.Maybe;
import io.reactivex.Single;
import io.vertx.core.json.JsonObject;
import io.vertx.ext.mongo.FindOptions;
import io.vertx.reactivex.ext.mongo.MongoClient;
import org.apache.commons.collections4.CollectionUtils;


import java.util.Collections;
import java.util.List;

public class DB {

    private final MongoClient mongoClient;

    public DB(MongoClient mongoClient) {
        this.mongoClient = mongoClient;
    }

    public Maybe<Snapshot> getLast(String bracket) {
        return getLast(bracket, 0);
    }

    public Maybe<Snapshot> getLast(String bracket, int skip) {
        FindOptions fopts = new FindOptions().setSort(new JsonObject().put("timestamp", -1)).setLimit(1).setSkip(skip);
        JsonObject opts = new JsonObject();
        return mongoClient.rxFindWithOptions(bracket, opts, fopts).flatMapMaybe(res -> {
            List<Snapshot> snapshots = res.stream().map(Snapshot::fromJson).toList();
            if (snapshots.size() > 0) {
                return Maybe.just(snapshots.get(0));
            } else {
                return Maybe.empty();
            }
        });
    }

    public Maybe<Snapshot> getMinsAgo(String bracket, int mins) {
        long now = System.currentTimeMillis();
        long minsAgo = now - mins * 60 * 1000;
        FindOptions fopts = new FindOptions().setSort(new JsonObject().put("timestamp", 1)).setLimit(1);
        JsonObject opts = new JsonObject()
            .put("timestamp", new JsonObject().put("$lt", now).put("$gt", minsAgo));
        return mongoClient.rxFindWithOptions(bracket, opts, fopts).flatMapMaybe(res -> {
            List<Snapshot> snapshots = res.stream().map(Snapshot::fromJson).toList();
            if (snapshots.size() > 0) {
                return Maybe.just(snapshots.get(0));
            } else {
                return Maybe.empty();
            }
        });
    }

    public Completable insertOnlyIfDifferent(String bracket, Snapshot snapshot) {
        return getLast(bracket).flatMapCompletable(last -> {
            if (CollectionUtils.isEqualCollection(last.characters(), snapshot.characters())) {
                return Completable.complete();
            } else {
                return mongoClient.rxSave(bracket, snapshot.toJson()).ignoreElement();
            }
        });
    }

}
