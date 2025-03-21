package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.db.Snapshot;
import io.reactivex.Completable;
import io.reactivex.Flowable;
import io.reactivex.Single;
import org.javatuples.Pair;
import org.javatuples.Triplet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

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

    public boolean isCharsLoaded() {
        return charsLoaded.get();
    }

    public Completable updateCharacters(String region,
                                        int timeWithoutUpdateMin, TimeUnit units,
                                        int timeout, TimeUnit timeoutUnits) {
        return Completable.defer(() -> {
            log.info("Updating characters for region " + region);
            // Get top chars from 3v3, 2v2, RBG, shuffle
            // find those that has not been updated for timeWithoutUpdateMin
            // update them
            // prioritize those who have the highest rating
            // Stop when time is up
            long tick = System.currentTimeMillis();
            // nickName, realm, rating
            List<Triplet<String, String, Long>> newChars = new ArrayList<>();
            // nickName, realm, lastUpdate, rating
            Map<Pair<String, String>, Pair<Long, Long>> existing = new HashMap<>();
            for (String bracket : BRACKETS) {
                Snapshot snapshot = refs.refByBracket(bracket, region).get();
                if (snapshot == null) {
                    log.warn("No data for bracket {}-{}", region, bracket);
                    continue;
                }
                List<Character> chars = snapshot.characters();
                for (Character character : chars) {
                    Pair<String, String> key = Pair.with(character.name(), character.realm());
                    WowAPICharacter byFullName = characterCache.getByFullName(Character.fullNameByRealmAndName(character.name(), character.realm()));
                    if (byFullName != null && tick - byFullName.lastUpdatedUTCms() < units.toMillis(timeWithoutUpdateMin)) {
                        log.trace("Character {}-{} has been updated recently", character.name(), character.realm());
                    } else if (byFullName == null) {
                        newChars.add(Triplet.with(character.name(), character.realm(), character.rating()));
                    } else {
                        log.trace("Character {}-{} has not been updated for {} days", character.name(), character.realm(), TimeUnit.MILLISECONDS.toDays(tick - byFullName.lastUpdatedUTCms()));
                        existing.compute(key, (k, v) -> {
                            if (v == null) {
                                return Pair.with(byFullName.lastUpdatedUTCms(), character.rating());
                            } else {
                                return Pair.with(Math.max(v.getValue0(), byFullName.lastUpdatedUTCms()), Math.max(v.getValue1(), character.rating()));
                            }
                        });
                    }
                }
            }
            // sort new chars by rating from highest to lowest
            List<Pair<String, String>> newCharsSorted = newChars.stream()
                .sorted(Comparator.comparingLong(value -> -value.getValue2()))
                .map(triplet -> Pair.with(triplet.getValue0(), triplet.getValue1()))
                .toList();
            // sort existing chars by rating from highest to lowest
            List<Pair<String, String>> existingSorted = existing.entrySet().stream()
                .sorted(Comparator.comparingLong(entry -> -entry.getValue().getValue1()))
                .map(Map.Entry::getKey)
                .toList();
            List<Pair<String, String>> randomNotUpdatedChars = new ArrayList<>(
                characterCache.values().stream()
                    .filter(bts -> tick - WowAPICharacter.fromGzippedJson(bts).lastUpdatedUTCms() > units.toMillis(timeWithoutUpdateMin))
                    .map(WowAPICharacter::fromGzippedJson)
                    .map(btw -> Pair.with(btw.name(), btw.realm()))
                    .toList()
            );

            Collections.shuffle(randomNotUpdatedChars, ThreadLocalRandom.current());
            randomNotUpdatedChars = randomNotUpdatedChars.stream().limit(10_000).toList();
            // merge in a following way:
            // 1. put one from newCharsSorted
            // 2. put one from existingSorted
            // 3. repeat until both lists are empty
            List<Pair<String, String>> merged = new ArrayList<>(newCharsSorted.size() + existingSorted.size());
            Iterator<Pair<String, String>> newCharsIt = newCharsSorted.iterator();
            Iterator<Pair<String, String>> existingIt = existingSorted.iterator();
            Iterator<Pair<String, String>> randomNotUpdatedIt = randomNotUpdatedChars.iterator();
            while (newCharsIt.hasNext() || existingIt.hasNext()) {
                if (newCharsIt.hasNext()) {
                    merged.add(newCharsIt.next());
                }
                if (existingIt.hasNext()) {
                    merged.add(existingIt.next());
                }
                if (randomNotUpdatedIt.hasNext()) {
                    merged.add(randomNotUpdatedIt.next());
                }
            }
            characterCache.calculateSizeMetrics();
            // merged into list of nickNames
            log.info("There is {} new chars, {} existing chars and {} random not updated chars in region {} that need to be updated. We have {} {} to do it",
                newCharsSorted.size(), existingSorted.size(), randomNotUpdatedChars.size(), region, timeout, timeoutUnits.name());
            // transform merged list into list of completables
            return Flowable.fromIterable(
                    merged.stream()
                        .map(pair -> updateChar(region, Character.fullNameByRealmAndName(pair.getValue0(), pair.getValue1())))
                        .toList())
                .flatMapCompletable(c -> c, true, 1)
                .takeUntil(Completable.timer(timeout, timeoutUnits));
        }).onErrorComplete().subscribeOn(Main.VTHREAD_SCHEDULER);
    }

    public Completable updateChars(List<String> nickNames, String region) {
        return Completable.concat(nickNames.stream().map(nickName -> updateChar(region, nickName)).toList())
            .subscribeOn(Main.VTHREAD_SCHEDULER);
    }

    public Completable updateChar(String region, String nickName) {
        return Completable.defer(() -> {
                if (charsLoaded.get()) {
                    return api.character(region, nickName).flatMapCompletable(this::updateCharsDbSize).onErrorComplete();
                } else {
                    log.warn("Not allowing char updates before char load from db");
                    return Completable.error(new IllegalStateException("Not allowing char updates before char load from db"));
                }
            }
        );
    }

    private Completable updateCharsDbSize(WowAPICharacter wowAPICharacter) {
        Set<WowAPICharacter> inconsistencies = characterCache.findAltsInconsistenciesAndFix(wowAPICharacter);
        Completable fixInconsistencies;
        if (inconsistencies.isEmpty()) {
            fixInconsistencies = Completable.complete();
        } else {
            fixInconsistencies = db.bulkUpdateChars(inconsistencies.stream().toList()).ignoreElement().andThen(Completable.fromAction(() -> {
                log.info("Updated {} alts inconsistencies", inconsistencies.size());
            }));
        }
        inconsistencies.forEach(characterCache::upsert);
        characterCache.upsert(wowAPICharacter);
        charSearchIndex.insertNickNamesWC(List.of(wowAPICharacter));
        return db.upsertCharacter(wowAPICharacter).ignoreElement().andThen(fixInconsistencies);
    }

    public Single<Optional<WowAPICharacter>> updateCharFast(String region, String nickName) {
        return Single.defer(() -> {
                if (charsLoaded.get()) {
                    return api.character(region, nickName)
                        .doAfterSuccess(wowAPICharacter -> Main.VTHREAD_SCHEDULER.scheduleDirect(() -> updateCharsDbSize(wowAPICharacter).subscribe()))
                        .map(Optional::of)
                        .onErrorReturnItem(Optional.empty())
                        .toSingle(Optional.empty());
                } else {
                    log.warn("Not allowing char updates before char load from db");
                    return Single.error(new IllegalStateException("Not allowing char updates before char load from db"));
                }
            }
        );
    }
}
