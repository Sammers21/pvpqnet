package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.*;
import io.github.sammers.pla.db.DB;
import io.reactivex.Completable;
import io.reactivex.Flowable;
import io.reactivex.Maybe;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
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
            Map<String, Long> nickAndMaxRating = new ConcurrentHashMap<>();
            return Maybe.concat(boards)
                .toList()
                .map((List<PvpLeaderBoard> list) -> {
                    Set<String> charsToUpdate = new HashSet<>();
                    for (PvpLeaderBoard board : list) {
                        for (CharOnLeaderBoard charOnLeaderBoard : board.charOnLeaderBoards()) {
                            if (characterCache.get(charOnLeaderBoard.fullName()) == null) {
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
                    long dayAgo = Instant.now().minus(30, ChronoUnit.DAYS).toEpochMilli();
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
                    return Flowable.fromIterable(charsToUpdate)
                        .sorted(((Comparator<String>) (o1, o2) -> {
                            Long maxRating1 = nickAndMaxRating.get(o1);
                            Long maxRating2 = nickAndMaxRating.get(o2);
                            return Long.compare(maxRating2, maxRating1);
                        }))
                        .map(nickName -> updateChar(region, nickName))
                        .buffer(5)
                        .toList()
                        .flatMapCompletable(list -> Completable.concat(list.stream().map(Completable::merge).toList()))
                        .doOnComplete(() -> log.info("Updated " + charsToUpdate.size() + " chars"))
                        .doOnError(e -> log.error("Error updating chars", e));
                });
        }).subscribeOn(Main.VTHREAD_SCHEDULER).andThen(Completable.defer(() -> updateCharsInfinite(region)));
    }

    public Completable updateChar(String region, String nickName) {
        return api.character(region, nickName).flatMapCompletable(wowAPICharacter -> {
            characterCache.put(nickName, wowAPICharacter);
            charSearchIndex.insertNickNames(new SearchResult(nickName, region, wowAPICharacter.clazz()));
            return db.upsertCharacter(wowAPICharacter).ignoreElement();
        }).onErrorComplete();
    }
}
