package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.CharOnLeaderBoard;
import io.github.sammers.pla.blizzard.PvpLeaderBoard;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.DB;
import io.reactivex.Completable;
import io.reactivex.Flowable;
import io.reactivex.Maybe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Stream;

import static io.github.sammers.pla.logic.Ladder.*;

public class CharUpdater {

    private static final Logger log = LoggerFactory.getLogger(CharUpdater.class);

    private final BlizzardAPI api;
    private final Map<String, WowAPICharacter> characterCache;
    private final NickNameSearchIndex charSearchIndex;
    private final DB db;

    public CharUpdater(BlizzardAPI api,
                       Map<String, WowAPICharacter> characterCache,
                       NickNameSearchIndex charSearchIndex,
                       DB db) {
        this.api = api;
        this.characterCache = characterCache;
        this.charSearchIndex = charSearchIndex;
        this.db = db;
    }

    public Completable updateCharsInfinite(String region) {
        return Completable.defer(() -> {
            log.info("Updating chars in region " + region);
            List<Maybe<PvpLeaderBoard>> boards = new ArrayList<>(Stream.of(TWO_V_TWO, THREE_V_THREE, RBG)
                .map(bracket -> api.pvpLeaderboard(bracket, region)).toList());
            for (String spec : shuffleSpecs) {
                String s = spec.replaceAll("/", "-");
                boards.add(api.pvpLeaderboard(s, region));
            }
            return Maybe.concat(boards)
                .toList()
                .map((List<PvpLeaderBoard> list) -> {
                    Set<String> charsToUpdate = new HashSet<>();
                    for (PvpLeaderBoard board : list) {
                        for (CharOnLeaderBoard charOnLeaderBoard : board.charOnLeaderBoards()) {
                            if (characterCache.get(charOnLeaderBoard.fullName()) == null) {
                                charsToUpdate.add(charOnLeaderBoard.fullName());
                            }
                        }
                    }
                    int newChars = charsToUpdate.size();
                    long dayAgo = Instant.now().minus(7, ChronoUnit.DAYS).toEpochMilli();
                    characterCache.values().stream().flatMap(wowAPICharacter -> {
                        if (wowAPICharacter.lastUpdatedUTCms() < dayAgo) {
                            return Stream.of(wowAPICharacter);
                        } else {
                            return Stream.of();
                        }
                    }).map(WowAPICharacter::fullName).forEach(charsToUpdate::add);
                    log.info("Completely new chars required to be updated: " + newChars + ", old chars: " + (charsToUpdate.size() - newChars));
                    return charsToUpdate;
                }).flatMapCompletable(charsToUpdate -> {
                    log.info("Updating " + charsToUpdate.size() + " chars");
                    List<Completable> compList = charsToUpdate.stream().map(nickName -> {
                        return api.character(region, nickName).flatMapCompletable(wowAPICharacter -> {
                            characterCache.put(nickName, wowAPICharacter);
                            charSearchIndex.insertNickNames(new SearchResult(nickName, region, wowAPICharacter.clazz()));
                            return db.upsertCharacter(wowAPICharacter).ignoreElement();
                        }).onErrorComplete();
                    }).toList();
                    return Flowable.fromIterable(compList)
                        .buffer(5)
                        .toList()
                        .flatMapCompletable(list -> Completable.concat(list.stream().map(Completable::merge).toList()))
                        .doOnComplete(() -> log.info("Updated " + charsToUpdate.size() + " chars"))
                        .doOnError(e -> log.error("Error updating chars", e));
                });
        }).subscribeOn(Main.VTHREAD_SCHEDULER).andThen(Completable.defer(() -> updateCharsInfinite(region)));
    }
}
