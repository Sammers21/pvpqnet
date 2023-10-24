package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.PvpBracket;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.db.Snapshot;
import io.reactivex.Completable;
import io.reactivex.Maybe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Stream;

import static io.github.sammers.pla.logic.Conts.*;

public class CharUpdater {

    private static final Logger log = LoggerFactory.getLogger(CharUpdater.class);
    private final BlizzardAPI api;
    private final CharacterCache characterCache;
    private final NickNameSearchIndex charSearchIndex;
    private final AtomicBoolean charsLoaded;
    private final DB db;
    private final Refs refs;

    public CharUpdater(BlizzardAPI api,
                       CharacterCache characterCache,
                       AtomicBoolean charsLoaded, Refs refs,
                       NickNameSearchIndex charSearchIndex,
                       DB db) {
        this.api = api;
        this.charsLoaded = charsLoaded;
        this.refs = refs;
        this.characterCache = characterCache;
        this.charSearchIndex = charSearchIndex;
        this.db = db;
    }

    public Completable updateCharsInfinite(String region) {
        return Completable.defer(() -> {
            log.info("Updating chars in region " + region);
            List<Snapshot> snapshots = new ArrayList<>(Stream.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE)
                .map(bracket -> refs.refByBracket(bracket, region).get()).toList());
            Map<String, Long> nickAndMaxRating = new ConcurrentHashMap<>();
            return Maybe.just(snapshots)
                .map((List<Snapshot> list) -> {
                    Set<String> charsToUpdate = new HashSet<>();
                    for (Snapshot board : list) {
                        for (Character charOnLeaderBoard : board.characters()) {
                            if (characterCache.getByFullName(charOnLeaderBoard.fullName()) == null) {
                                charsToUpdate.add(charOnLeaderBoard.fullName());
                                nickAndMaxRating.compute(charOnLeaderBoard.fullName(), (nick, maxRating) -> {
                                    if (maxRating == null) {
                                        return charOnLeaderBoard.rating();
                                    } else {
                                        return Math.max(maxRating, charOnLeaderBoard.rating());
                                    }
                                });
                            }
                        }
                    }
                    int newChars = charsToUpdate.size();
                    long dayAgo = Instant.now().minus(1, ChronoUnit.DAYS).toEpochMilli();
                    characterCache.values().stream().flatMap(wowAPICharacter -> {
                        if (wowAPICharacter.lastUpdatedUTCms() < dayAgo) {
                            nickAndMaxRating.compute(wowAPICharacter.fullName(), (nick, maxRating) -> {
                                Long chMax = wowAPICharacter.brackets().stream().max(Comparator.comparingLong(PvpBracket::rating)).map(PvpBracket::rating).orElse(0L);
                                if (maxRating == null) {
                                    return chMax;
                                } else {
                                    return Math.max(maxRating, chMax);
                                }
                            });
                            return Stream.of(wowAPICharacter);
                        } else {
                            return Stream.of();
                        }
                    }).map(WowAPICharacter::fullName).forEach(charsToUpdate::add);
                    log.info("Completely new chars required to be updated: " + newChars + ", old chars: " + (charsToUpdate.size() - newChars));
                    return charsToUpdate;
                }).flatMapCompletable(charsToUpdate -> {
                    log.info("Updating " + charsToUpdate.size() + " chars");
                    // first we update 300 highest rated characters
                    // and everything else is after
                    List<String> charsToUpdateList = new ArrayList<>(charsToUpdate);
                    charsToUpdateList.sort(Comparator.comparingLong(nickAndMaxRating::get).reversed());
                    List<String> firstPortion = charsToUpdateList.subList(0, Math.min(charsToUpdateList.size(), 300));
                    List<String> rest = charsToUpdateList.subList(firstPortion.size(), charsToUpdateList.size());
                    return updateChars(firstPortion, region)
                        .doOnSubscribe(d -> log.info("Updating first portion of chars: " + firstPortion.size()))
                        .doOnComplete(() -> log.info("First portion of chars has been updated"))
                        .andThen(updateChars(rest, region))
                        .doOnSubscribe(d -> log.info("Updating second portion of chars: " + rest.size()))
                        .doOnComplete(() -> log.info("Second portion of chars has been updated"))
                        .onErrorComplete();
                });
        }).subscribeOn(Main.VTHREAD_SCHEDULER).doOnError(e -> log.error("Update chars infinite error in region " + region, e));
    }

    public Completable updateChars(List<String> nickNames, String region) {
        return Completable.concat(nickNames.stream().map(nickName -> updateChar(region, nickName)).toList())
            .subscribeOn(Main.VTHREAD_SCHEDULER);
    }

    public Completable updateChar(String region, String nickName) {
        return Completable.defer(() -> {
                if (charsLoaded.get()) {
                    return api.character(region, nickName).flatMapCompletable(wowAPICharacter -> {
                        characterCache.upsert(wowAPICharacter);
                        charSearchIndex.insertNickNamesWC(List.of(wowAPICharacter));
                        return db.upsertCharacter(wowAPICharacter).ignoreElement();
                    }).onErrorComplete();
                } else {
                    log.warn("Not allowing char updates before char load from db");
                    return Completable.complete();
                }
            }
        );
    }
}
