package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.*;
import io.github.sammers.pla.db.DB;
import io.reactivex.Completable;
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
    private final Map<Integer, Set<WowAPICharacter>> altsCache;
    private final NickNameSearchIndex charSearchIndex;
    private final DB db;

    public CharUpdater(BlizzardAPI api,
                       Map<String, WowAPICharacter> characterCache,
                       Map<Integer, Set<WowAPICharacter>> altsCache, NickNameSearchIndex charSearchIndex,
                       DB db) {
        this.api = api;
        this.characterCache = characterCache;
        this.altsCache = altsCache;
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
                    long dayAgo = Instant.now().minus(7, ChronoUnit.DAYS).toEpochMilli();
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
                        .doOnComplete(() -> log.info("Second portion of chars has been updated"));
                });
        }).subscribeOn(Main.VTHREAD_SCHEDULER)
            .andThen(Completable.defer(() -> updateCharsInfinite(region)));
    }

    public Completable updateChars(List<String> nickNames, String region) {
        return Completable.concat(nickNames.stream().map(nickName -> updateChar(region, nickName)).toList())
            .subscribeOn(Main.VTHREAD_SCHEDULER);
    }

    public Completable updateChar(String region, String nickName) {
        return api.character(region, nickName).flatMapCompletable(wowAPICharacter -> {
            Calculator.indexCharAlts(altsCache, wowAPICharacter);
            characterCache.put(nickName, wowAPICharacter);
            charSearchIndex.insertNickNames(new SearchResult(nickName, region, wowAPICharacter.clazz()));
            return db.upsertCharacter(wowAPICharacter).ignoreElement();
        }).onErrorComplete();
    }
}
