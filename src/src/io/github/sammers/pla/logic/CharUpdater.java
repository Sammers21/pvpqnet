package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.DB;
import io.github.sammers.pla.db.Snapshot;
import io.prometheus.metrics.core.metrics.Counter;
import io.prometheus.metrics.core.metrics.Gauge;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Maybe;
import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.core.Single;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

import static io.github.sammers.pla.logic.Conts.*;

public class CharUpdater {
  private static final Logger log = LoggerFactory.getLogger(CharUpdater.class);
  // Priority weights
  private static final double WEIGHT_NEW_CHAR = 10.0;
  private static final double WEIGHT_TOP200_NEW_CHAR = 50 * WEIGHT_NEW_CHAR;
  private static final double WEIGHT_STALE_30D = 2.0;
  private static final double WEIGHT_STALE_7D = 1.0;
  private static final double WEIGHT_STALE_1D = 0.5;
  // Time thresholds in milliseconds
  private static final long MS_30_DAYS = TimeUnit.DAYS.toMillis(30);
  private static final long MS_7_DAYS = TimeUnit.DAYS.toMillis(7);
  private static final long MS_1_DAY = TimeUnit.DAYS.toMillis(1);
  // Not found cache eviction period (30 days)
  private static final long NOT_FOUND_EVICTION_MS = TimeUnit.DAYS.toMillis(30);
  // Update queue recomputation interval
  private static final long QUEUE_RECOMPUTE_INTERVAL_MS = TimeUnit.HOURS.toMillis(3);
  private final BlizzardAPI mainApi;
  private final BlizzardAPI indexerApi;
  private final CharacterCache characterCache;
  private final NickNameSearchIndex charSearchIndex;
  private final DB db;
  private final Refs refs;
  // Cache for characters that were not found (404) - key: fullName, value:
  // timestamp when added
  private final Map<String, Long> notFoundCache = new ConcurrentHashMap<>();
  // Cached update queues per region
  private final Map<String, UpdateQueue> updateQueues = new ConcurrentHashMap<>();
  // Consolidated Metrics
  // Indexer character counts: pending new, not found, total
  private final Gauge indexerChars = Gauge.builder()
    .name("indexer_chars")
    .help("Character counts for indexer")
    .labelNames("region", "type")
    .register();
  // Stale characters by period (1d, 7d, 30d)
  private final Gauge indexerStaleChars = Gauge.builder()
    .name("indexer_stale_chars")
    .help("Characters not updated " + "for specified period")
    .labelNames("region", "period")
    .register();
  // Average staleness in hours
  private final Gauge indexerAvgStalenessHours = Gauge.builder()
    .name("indexer_avg_staleness_hours")
    .help("Average " + "hours since last character update")
    .labelNames("region")
    .register();
  // Counter for new characters added
  private final Counter indexerNewCharsAdded = Counter.builder()
    .name("indexer_new_chars_added_total")
    .help("Total " + "new characters added to the database")
    .labelNames("region")
    .register();

  public CharUpdater(BlizzardAPI mainApi, BlizzardAPI indexerApi, CharacterCache characterCache, Refs refs,
    NickNameSearchIndex charSearchIndex, DB db) {
    this.mainApi = mainApi;
    this.indexerApi = indexerApi;
    this.refs = refs;
    this.characterCache = characterCache;
    this.charSearchIndex = charSearchIndex;
    this.db = db;
  }

  /**
   * Starts background indexer processes for both EU and US regions. Should be
   * called after characters are loaded from DB.
   */
  public Completable startBackgroundIndexers() {
    return Completable.fromAction(() -> {
      log.info("Starting background indexer processes for EU and US");
      startBackgroundIndexer(EU);
      startBackgroundIndexer(US);
    });
  }

  public Single<Optional<WowAPICharacter>> updateChar(String region, String nickName, boolean fast) {
    return Single.defer(() -> {
      Maybe<WowAPICharacter> charMaybe = mainApi.character(region, nickName);
      return charMaybe.map(Optional::of).defaultIfEmpty(Optional.empty()).flatMap(wowAPICharacterOpt -> {
        if (wowAPICharacterOpt.isEmpty()) {
          return Single.just(Optional.empty());
        }
        WowAPICharacter wowAPICharacter = wowAPICharacterOpt.get();
        return preserveHiddenFromPrevious(wowAPICharacter).flatMap(updatedCharacter -> {
          try {
            charSearchIndex.insertNickNamesWC(List.of(updatedCharacter));
          } catch (Exception e) {
            log.warn("Failed to update search index for {}: {}", nickName, e.getMessage());
          }
          Single<Optional<WowAPICharacter>> innerResult;
          if (fast) {
            Main.VTHREAD_SCHEDULER.scheduleDirect(() -> updateCharsDbSize(updatedCharacter).subscribe());
            innerResult = Single.just(Optional.of(updatedCharacter));
          } else {
            innerResult = updateCharsDbSize(updatedCharacter).andThen(Single.just(Optional.of(updatedCharacter)));
          }
          return innerResult;
        });
      });
    });
  }

  public Single<Optional<WowAPICharacter>> updateCharFast(String region, String nickName) {
    return updateChar(region, nickName, true);
  }

  public Completable changeVisibility(long id, boolean hidden) {
    return Completable.defer(() -> db.getCharacterById(id).flatMapCompletable(characterOpt -> {
      if (characterOpt.isEmpty()) {
        return Completable.error(new IllegalStateException("Character not found"));
      }
      WowAPICharacter updated = characterOpt.get().withHidden(hidden);
      return db.upsertCharacter(updated).ignoreElement().andThen(Completable.fromAction(() -> {
        if (hidden) {
          characterCache.remove(updated);
          charSearchIndex.deleteNickName(updated.fullName());
        } else {
          characterCache.upsert(updated);
          charSearchIndex.insertNickNamesWC(List.of(updated));
        }
      }));
    }));
  }

  private Single<WowAPICharacter> preserveHiddenFromPrevious(WowAPICharacter character) {
    WowAPICharacter cached = characterCache.getById(character.id());
    if (cached != null) {
      return Single.just(character.withHidden(cached.hidden()));
    }
    return db.getCharacterById(character.id()).flatMap(prevOpt -> {
      if (prevOpt.isPresent()) {
        return Single.just(character.withHidden(prevOpt.get().hidden()));
      }
      return db.getCharacterByNameRealmRegion(character.name(), character.realm(), character.region())
        .map(prevByName -> prevByName.map(WowAPICharacter::hidden).map(character::withHidden).orElse(character));
    }).onErrorReturnItem(character);
  }

  /**
   * Starts an infinite background indexer process for a specific region. The
   * process continuously updates characters based on priority weights.
   */
  private void startBackgroundIndexer(String region) {
    String realRegion = BlizzardAPI.realRegion(region);
    Main.VTHREAD_SCHEDULER.scheduleDirect(() -> {
      log.info("[{}] Background indexer started", realRegion);
      long lastStatsLogTime = System.currentTimeMillis();
      long updatedCount = 0;
      long newCharsCount = 0;
      final long STATS_LOG_INTERVAL_MS = TimeUnit.MINUTES.toMillis(5);
      while (true) {
        try {
          // Clean expired entries from not found cache
          cleanNotFoundCache();
          UpdateQueue updateQueue = getOrRecomputeQueue(region, realRegion);
          // Log stats periodically
          long now = System.currentTimeMillis();
          if (now - lastStatsLogTime >= STATS_LOG_INTERVAL_MS) {
            IndexerStats stats = updateQueue.stats();
            double avgStalenessHours = stats.avgStalenessMs / (1000.0 * 60 * 60);
            log.info(
              "[{}] Indexer stats: pending={}, top200Pending={}, stale30d={}, stale7d={}, "
                + "stale1d={}, notFound={}, totalIndexed={}, onLeaderboard={}, avgStaleness={}h, "
                + "queueSize={}, updated={}/min, newAdded={}/min",
              realRegion, stats.newChars.size(), stats.top200NewChars.size(), stats.stale30dChars.size(),
              stats.stale7dChars.size(), stats.stale1dChars.size(), stats.notFoundCount,
              characterCache.countByRegion(realRegion), stats.totalCharsCount, String.format("%.1f", avgStalenessHours),
              updateQueue.queue().size(), updatedCount, newCharsCount);
            lastStatsLogTime = now;
            updatedCount = 0;
            newCharsCount = 0;
          }
          // Select next batch of characters to update (up to 5)
          List<String> batch = new ArrayList<>(5);
          for (int i = 0; i < 5; i++) {
            String nextChar = updateQueue.queue().pollFirst();
            if (nextChar != null) {
              batch.add(nextChar);
            }
          }
          if (batch.isEmpty()) {
            log.info("[{}] No characters to update, sleeping 10s...", realRegion);
            Thread.sleep(10000);
            continue;
          }
          // Update characters in parallel using RxJava
          long startTime = System.currentTimeMillis();
          List<Completable> completables = new ArrayList<>(batch.size());
          int batchNewCharsCount = 0;
          for (String charName : batch) {
            boolean wasNew = updateQueue.stats().newChars.contains(charName);
            if (wasNew) {
              batchNewCharsCount++;
            }
            boolean isTop200New = updateQueue.stats().top200NewChars.contains(charName);
            String charType = isTop200New
              ? "TOP200_NEW"
              : (wasNew
                ? "NEW"
                : (updateQueue.stats().stale30dChars.contains(charName)
                  ? "STALE_30D"
                  : updateQueue.stats().stale7dChars.contains(charName)
                    ? "STALE_7D"
                    : updateQueue.stats().stale1dChars.contains(charName) ? "STALE_1D" : "REFRESH"));
            log.info("[{}] Updating {} character: {}", realRegion, charType, charName);
            completables.add(
              updateCharWithNotFoundTracking(region, charName, wasNew, realRegion).subscribeOn(Main.VTHREAD_SCHEDULER));
          }
          final int finalBatchNewCharsCount = batchNewCharsCount;
          Completable.merge(completables).subscribeOn(Main.VTHREAD_SCHEDULER).doOnComplete(() -> {
            long elapsed = System.currentTimeMillis() - startTime;
            log.info("[{}] Updated batch of {} chars in {}ms", realRegion, batch.size(), elapsed);
          }).blockingAwait();
          updatedCount += batch.size();
          newCharsCount += finalBatchNewCharsCount;
        } catch (InterruptedException e) {
          log.warn("[{}] Background indexer interrupted", realRegion);
          Thread.currentThread().interrupt();
          break;
        } catch (Exception e) {
          log.error("[{}] Error in background indexer", realRegion, e);
          try {
            Thread.sleep(5000);
          } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            break;
          }
        }
      }
      log.info("[{}] Background indexer stopped", realRegion);
    });
  }

  /**
   * Collects statistics about characters that need to be updated.
   */
  private IndexerStats collectCharacterStats(String region) {
    long now = System.currentTimeMillis();
    String realRegion = BlizzardAPI.realRegion(region);
    Set<String> newChars = new HashSet<>();
    Set<String> top200NewChars = new HashSet<>();
    Set<String> stale30dChars = new HashSet<>();
    Set<String> stale7dChars = new HashSet<>();
    Set<String> stale1dChars = new HashSet<>();
    long totalStalenessMs = 0;
    int totalCharsCount = 0;
    // Collect characters from all brackets
    Set<String> allLeaderboardChars = new HashSet<>();
    Map<String, Long> leaderboardPositions = new HashMap<>();
    for (String bracket : BRACKETS) {
      Snapshot snapshot = refs.refByBracket(bracket, region).get();
      if (snapshot == null) {
        continue;
      }
      for (Character character : snapshot.characters()) {
        String fullName = Character.fullNameByRealmAndName(character.name(), character.realm());
        allLeaderboardChars.add(fullName);
        if (character.pos() != null) {
          leaderboardPositions.merge(fullName, character.pos(), Math::min);
        }
      }
    }
    // Count not found cache entries for this region
    long notFoundCount = notFoundCache.entrySet().stream().filter(e -> {
      WowAPICharacter cached = characterCache.getByFullName(e.getKey());
      return cached == null || cached.region().equals(realRegion);
    }).count();
    // Categorize characters
    for (String fullName : allLeaderboardChars) {
      // Skip if in not found cache
      if (isInNotFoundCache(fullName)) {
        continue;
      }
      WowAPICharacter cached = characterCache.getByFullName(fullName);
      long pos = leaderboardPositions.getOrDefault(fullName, Long.MAX_VALUE);
      boolean inTop200 = pos > 0 && pos <= 200;
      if (cached == null) {
        newChars.add(fullName);
        if (inTop200) {
          top200NewChars.add(fullName);
        }
      } else {
        long staleness = now - cached.lastUpdatedUTCms();
        totalStalenessMs += staleness;
        totalCharsCount++;
        if (staleness > MS_30_DAYS) {
          stale30dChars.add(fullName);
        } else if (staleness > MS_7_DAYS) {
          stale7dChars.add(fullName);
        } else if (staleness > MS_1_DAY) {
          stale1dChars.add(fullName);
        }
      }
    }
    double avgStaleness = totalCharsCount > 0 ? (double) totalStalenessMs / totalCharsCount : 0;
    return new IndexerStats(newChars, top200NewChars, stale30dChars, stale7dChars, stale1dChars, notFoundCount,
      totalCharsCount, avgStaleness);
  }

  /**
   * Updates Prometheus metrics based on collected stats.
   */
  private void updateMetrics(String region, IndexerStats stats) {
    // Character counts by type (per-region)
    indexerChars.labelValues(region, "pending").set(stats.newChars.size());
    indexerChars.labelValues(region, "not_found").set(stats.notFoundCount);
    indexerChars.labelValues(region, "on_leaderboard").set(stats.totalCharsCount);
    indexerChars.labelValues(region, "total").set(characterCache.countByRegion(region));
    // Stale characters by period
    indexerStaleChars.labelValues(region, "1d").set(stats.stale1dChars.size());
    indexerStaleChars.labelValues(region, "7d").set(stats.stale7dChars.size());
    indexerStaleChars.labelValues(region, "30d").set(stats.stale30dChars.size());
    // Average staleness
    indexerAvgStalenessHours.labelValues(region).set(stats.avgStalenessMs / (1000.0 * 60 * 60));
    characterCache.calculateSizeMetrics();
  }

  private UpdateQueue getOrRecomputeQueue(String region, String realRegion) {
    UpdateQueue currentQueue = updateQueues.get(realRegion);
    long now = System.currentTimeMillis();
    boolean needsRecompute = currentQueue == null || now - currentQueue.computedAtMs >= QUEUE_RECOMPUTE_INTERVAL_MS;
    if (needsRecompute) {
      return recomputeUpdateQueue(region, realRegion);
    }
    return currentQueue;
  }

  private UpdateQueue recomputeUpdateQueue(String region, String realRegion) {
    long startTime = System.currentTimeMillis();
    IndexerStats stats = collectCharacterStats(region);
    updateMetrics(realRegion, stats);
    Deque<String> queue = buildUpdateQueue(stats);
    long elapsedMs = System.currentTimeMillis() - startTime;
    log.info("[{}] Update queue computation took {}s (size={})", realRegion, elapsedMs / 1000.0, queue.size());
    UpdateQueue updateQueue = new UpdateQueue(queue, stats, System.currentTimeMillis());
    updateQueues.put(realRegion, updateQueue);
    return updateQueue;
  }

  private Deque<String> buildUpdateQueue(IndexerStats stats) {
    List<WeightedEntry> weightedEntries = new ArrayList<>();
    for (String fullName : stats.top200NewChars) {
      weightedEntries.add(new WeightedEntry(fullName, weightedPriority(WEIGHT_TOP200_NEW_CHAR)));
    }
    for (String fullName : stats.newChars) {
      if (stats.top200NewChars.contains(fullName)) {
        continue;
      }
      weightedEntries.add(new WeightedEntry(fullName, weightedPriority(WEIGHT_NEW_CHAR)));
    }
    for (String fullName : stats.stale30dChars) {
      weightedEntries.add(new WeightedEntry(fullName, weightedPriority(WEIGHT_STALE_30D)));
    }
    for (String fullName : stats.stale7dChars) {
      weightedEntries.add(new WeightedEntry(fullName, weightedPriority(WEIGHT_STALE_7D)));
    }
    for (String fullName : stats.stale1dChars) {
      weightedEntries.add(new WeightedEntry(fullName, weightedPriority(WEIGHT_STALE_1D)));
    }
    if (weightedEntries.isEmpty()) {
      return new ArrayDeque<>();
    }
    weightedEntries.sort(Comparator.comparingDouble(WeightedEntry::priority));
    Deque<String> queue = new ArrayDeque<>(weightedEntries.size());
    for (WeightedEntry entry : weightedEntries) {
      queue.addLast(entry.fullName);
    }
    return queue;
  }

  private double weightedPriority(double weight) {
    double random = ThreadLocalRandom.current().nextDouble();
    double clampedRandom = random == 0 ? Double.MIN_VALUE : random;
    return -Math.log(clampedRandom) / weight;
  }

  /**
   * Updates a character and tracks 404 responses in the not found cache.
   */
  private Completable updateCharWithNotFoundTracking(String region, String fullName, boolean wasNew,
    String realRegion) {
    return updateChar(region, fullName, false).flatMapCompletable(opt -> {
      if (opt.isPresent()) {
        WowAPICharacter wowAPICharacter = opt.get();
        if (wasNew) {
          indexerNewCharsAdded.labelValues(realRegion).inc();
          log.info("[{}] Successfully ADDED new character: {} (class={}, spec={}, ilvl={})", realRegion, fullName,
            wowAPICharacter.clazz(), wowAPICharacter.activeSpec(), wowAPICharacter.itemLevel());
        }
      }
      return Completable.complete();
    }).onErrorResumeNext(error -> {
      // Check if it's a 404 (character not found)
      if (error.getMessage() != null && error.getMessage().contains("404")) {
        addToNotFoundCache(fullName);
        log.info("[{}] Character {} not found (404), added to not-found cache", realRegion, fullName);
      }
      return Completable.complete();
    });
  }

  /**
   * Adds a character to the not found cache.
   */
  private void addToNotFoundCache(String fullName) {
    notFoundCache.put(fullName, System.currentTimeMillis());
  }

  /**
   * Checks if a character is in the not found cache and not expired.
   */
  private boolean isInNotFoundCache(String fullName) {
    Long timestamp = notFoundCache.get(fullName);
    if (timestamp == null) {
      return false;
    }
    return System.currentTimeMillis() - timestamp < NOT_FOUND_EVICTION_MS;
  }

  /**
   * Cleans expired entries from the not found cache.
   */
  private void cleanNotFoundCache() {
    long now = System.currentTimeMillis();
    notFoundCache.entrySet().removeIf(entry -> now - entry.getValue() > NOT_FOUND_EVICTION_MS);
  }

  private Completable updateCharsDbSize(WowAPICharacter wowAPICharacter) {
    return Completable.defer(() -> {
      WowAPICharacter existing = characterCache.getByFullName(wowAPICharacter.fullName());
      if (existing != null && existing.id() != wowAPICharacter.id()) {
        log.info("Updating existing character : {} with id ={}", existing.fullName(), existing.id());
        log.info("After update {} has a different id ={} (was id ={})", wowAPICharacter.fullName(),
          wowAPICharacter.id(), existing.id());
        log.info("Migrating new one from the old one: {} (id ={}) <- {} (id ={})", wowAPICharacter.fullName(),
          wowAPICharacter.id(), existing.fullName(), existing.id());
        LinkedHashMap<Long, WowAPICharacter> migrateFromById = new LinkedHashMap<>();
        migrateFromById.put(existing.id(), existing);
        Set<Long> candidateIds = new HashSet<>(
          Optional.ofNullable(characterCache.alts.get(wowAPICharacter.petHash())).orElse(Set.of()));
        candidateIds.addAll(Optional.ofNullable(characterCache.alts.get(existing.petHash())).orElse(Set.of()));
        if (wowAPICharacter.alts() != null) {
          candidateIds.addAll(wowAPICharacter.alts());
        }
        if (existing.alts() != null) {
          candidateIds.addAll(existing.alts());
        }
        for (Long id : candidateIds) {
          if (id == null || id == wowAPICharacter.id() || id == existing.id()) {
            continue;
          }
          WowAPICharacter cached = characterCache.getById(id);
          if (cached != null && wowAPICharacter.fullName().equals(cached.fullName())
            && cached.id() != wowAPICharacter.id()) {
            if (!migrateFromById.containsKey(cached.id())) {
              log.info("Updating existing character : {} with id ={}", cached.fullName(), cached.id());
              log.info("After update {} has a different id ={} (was id ={})", wowAPICharacter.fullName(),
                wowAPICharacter.id(), cached.id());
              log.info("Migrating new one from the old one: {} (id ={}) <- {} (id ={})", wowAPICharacter.fullName(),
                wowAPICharacter.id(), cached.fullName(), cached.id());
            }
            migrateFromById.put(cached.id(), cached);
          }
        }
        WowAPICharacter merged = wowAPICharacter;
        for (WowAPICharacter prev : migrateFromById.values()) {
          merged = merged.mergeFromPreviousWithCombinedGamingHistory(prev);
        }
        Set<Long> newAlts = merged.alts();
        for (WowAPICharacter prev : migrateFromById.values()) {
          newAlts = remapAltIds(newAlts, prev.id(), merged.id(), merged.id());
        }
        WowAPICharacter normalized = newAlts.equals(merged.alts()) ? merged : merged.changeAlts(newAlts);
        Completable chain = Completable.complete();
        for (WowAPICharacter prev : migrateFromById.values()) {
          if (prev.id() != normalized.id()) {
            chain = chain.andThen(migrateCharacterIdentity(prev, normalized));
          }
        }
        return chain.andThen(upsertCharacterAndFixAlts(normalized));
      }
      if (existing == null) {
        Set<WowAPICharacter> alts = altsForIncludingHidden(wowAPICharacter);
        if (alts != null && !alts.isEmpty()) {
          return findInvalidSameClassAltByStatus(wowAPICharacter, alts).flatMapCompletable(prevOpt -> {
            if (prevOpt.isPresent()) {
              WowAPICharacter prev = prevOpt.get();
              log.info("Updating existing character : {} with id ={}", prev.fullName(), prev.id());
              if (prev.id() != wowAPICharacter.id()) {
                log.info("After update {} has a different id ={} (was id ={})", wowAPICharacter.fullName(),
                  wowAPICharacter.id(), prev.id());
              }
              log.info("Migrating new one from the old one: {} (id ={}) <- {} (id ={})", wowAPICharacter.fullName(),
                wowAPICharacter.id(), prev.fullName(), prev.id());
              LinkedHashMap<Long, WowAPICharacter> migrateFromById = new LinkedHashMap<>();
              migrateFromById.put(prev.id(), prev);
              Set<Long> candidateIds = new HashSet<>(
                Optional.ofNullable(characterCache.alts.get(wowAPICharacter.petHash())).orElse(Set.of()));
              candidateIds.addAll(Optional.ofNullable(characterCache.alts.get(prev.petHash())).orElse(Set.of()));
              if (wowAPICharacter.alts() != null) {
                candidateIds.addAll(wowAPICharacter.alts());
              }
              if (prev.alts() != null) {
                candidateIds.addAll(prev.alts());
              }
              for (WowAPICharacter alt : alts) {
                if (alt != null) {
                  candidateIds.add(alt.id());
                }
              }
              for (Long id : candidateIds) {
                if (id == null || id == wowAPICharacter.id() || id == prev.id()) {
                  continue;
                }
                WowAPICharacter cached = characterCache.getById(id);
                if (cached != null && wowAPICharacter.fullName().equals(cached.fullName())
                  && cached.id() != wowAPICharacter.id()) {
                  if (!migrateFromById.containsKey(cached.id())) {
                    log.info("Updating existing character : {} with id ={}", cached.fullName(), cached.id());
                    log.info("After update {} has a different id ={} (was id ={})", wowAPICharacter.fullName(),
                      wowAPICharacter.id(), cached.id());
                    log.info("Migrating new one from the old one: {} (id ={}) <- {} (id ={})",
                      wowAPICharacter.fullName(), wowAPICharacter.id(), cached.fullName(), cached.id());
                  }
                  migrateFromById.put(cached.id(), cached);
                }
              }
              WowAPICharacter merged = wowAPICharacter;
              for (WowAPICharacter src : migrateFromById.values()) {
                merged = merged.mergeFromPreviousWithCombinedGamingHistory(src);
              }
              Set<Long> newAlts = merged.alts();
              for (WowAPICharacter src : migrateFromById.values()) {
                newAlts = remapAltIds(newAlts, src.id(), merged.id(), merged.id());
              }
              WowAPICharacter normalized = newAlts.equals(merged.alts()) ? merged : merged.changeAlts(newAlts);
              Completable chain = Completable.complete();
              for (WowAPICharacter src : migrateFromById.values()) {
                if (src.id() != normalized.id()) {
                  chain = chain.andThen(migrateCharacterIdentity(src, normalized));
                }
              }
              return chain.andThen(upsertCharacterAndFixAlts(normalized));
            }
            return upsertCharacterAndFixAlts(wowAPICharacter);
          });
        }
      }
      return upsertCharacterAndFixAlts(wowAPICharacter);
    });
  }

  private Completable upsertCharacterAndFixAlts(WowAPICharacter wowAPICharacter) {
    var tuple = characterCache.removeNickDuplicates(wowAPICharacter);
    Set<Long> toDelete = tuple.getValue0();
    Set<WowAPICharacter> toUpdate = tuple.getValue1();
    Set<WowAPICharacter> inconsistencies = characterCache.findAltsInconsistenciesAndFix(wowAPICharacter);
    Completable fixInconsistencies = inconsistencies.isEmpty()
      ? Completable.complete()
      : db.bulkUpdateChars(inconsistencies.stream().toList())
        .ignoreElement()
        .andThen(Completable.fromAction(() -> log.info("Updated {} alts inconsistencies", inconsistencies.size())));
    Completable deleteDuplicates = toDelete.isEmpty()
      ? Completable.complete()
      : db.bulkDeleteChars(toDelete.stream().toList())
        .ignoreElement()
        .andThen(Completable.fromAction(() -> log.info("Deleted {} duplicate characters", toDelete.size())));
    Completable updateDuplicates = toUpdate.isEmpty()
      ? Completable.complete()
      : db.bulkUpdateChars(toUpdate.stream().toList())
        .ignoreElement()
        .andThen(
          Completable.fromAction(() -> log.info("Updated {} characters after duplicate removal", toUpdate.size())));
    inconsistencies.forEach(characterCache::upsert);
    toUpdate.forEach(characterCache::upsert);
    toDelete.forEach(characterCache::removeById);
    characterCache.upsert(wowAPICharacter);
    charSearchIndex.insertNickNamesWC(List.of(wowAPICharacter));
    return db.upsertCharacter(wowAPICharacter)
      .ignoreElement()
      .andThen(fixInconsistencies)
      .andThen(deleteDuplicates)
      .andThen(updateDuplicates);
  }

  private Set<WowAPICharacter> altsForIncludingHidden(WowAPICharacter character) {
    if (character == null) {
      return Set.of();
    }
    Set<Long> ids = new HashSet<>(Optional.ofNullable(characterCache.alts.get(character.petHash())).orElse(Set.of()));
    if (character.alts() != null) {
      ids.addAll(character.alts());
    }
    ids.remove(character.id());
    Set<WowAPICharacter> res = new HashSet<>();
    for (Long id : ids) {
      WowAPICharacter alt = characterCache.getById(id);
      if (alt != null) {
        res.add(alt);
      }
    }
    return res;
  }

  private Single<Optional<WowAPICharacter>> findInvalidSameClassAltByStatus(WowAPICharacter incoming,
    Set<WowAPICharacter> alts) {
    if (alts == null || alts.isEmpty()) {
      return Single.just(Optional.empty());
    }
    return Observable.fromIterable(alts).filter(Objects::nonNull).flatMapSingle(alt -> {
      String region = alt.region() == null ? incoming.region() : alt.region();
      return indexerApi.characterStatus(region, alt.realm(), alt.name())
        .map(isValid -> new AbstractMap.SimpleEntry<>(alt, isValid));
    })
      .toList()
      .map(results -> results.stream()
        .filter(e -> !e.getValue())
        .map(Map.Entry::getKey)
        .filter(alt -> Objects.equals(alt.clazz(), incoming.clazz()))
        .findFirst());
  }

  private static Set<Long> remapAltIds(Set<Long> current, long oldId, long newId, long selfId) {
    Set<Long> res = new HashSet<>(current == null ? Set.of() : current);
    if (oldId != newId) {
      if (res.remove(oldId) && selfId != newId) {
        res.add(newId);
      }
    }
    res.remove(selfId);
    return res;
  }

  private Completable migrateCharacterIdentity(WowAPICharacter previous, WowAPICharacter updated) {
    if (previous == null || updated == null) {
      return Completable.complete();
    }
    long oldId = previous.id();
    long newId = updated.id();
    Set<Long> ids = new HashSet<>(Optional.ofNullable(characterCache.alts.get(updated.petHash())).orElse(Set.of()));
    if (updated.alts() != null) {
      ids.addAll(updated.alts());
    }
    if (previous.alts() != null) {
      ids.addAll(previous.alts());
    }
    ids.add(oldId);
    ids.remove(newId);
    Set<WowAPICharacter> group = new HashSet<>();
    for (Long id : ids) {
      WowAPICharacter ch = characterCache.getById(id);
      if (ch != null) {
        group.add(ch);
      }
    }
    group.add(previous);
    List<WowAPICharacter> toPersist = new ArrayList<>();
    for (WowAPICharacter ch : group) {
      if (ch == null || ch.id() == oldId) {
        continue;
      }
      Set<Long> newAlts = remapAltIds(ch.alts(), oldId, newId, ch.id());
      WowAPICharacter changed = newAlts.equals(ch.alts()) ? ch : ch.changeAlts(newAlts);
      toPersist.add(changed);
    }
    Set<Long> updatedAlts = remapAltIds(updated.alts(), oldId, newId, updated.id());
    WowAPICharacter normalizedUpdated = updatedAlts.equals(updated.alts()) ? updated : updated.changeAlts(updatedAlts);
    toPersist.add(normalizedUpdated);
    characterCache.remove(previous);
    toPersist.forEach(characterCache::upsert);
    charSearchIndex.deleteNickName(previous.fullName());
    Completable deleteStep = oldId == newId ? Completable.complete() : db.deleteCharacterById(oldId);
    return deleteStep.andThen(db.bulkUpdateChars(toPersist).ignoreElement());
  }

  /**
   * Statistics collected for the indexer.
   */
  private record IndexerStats(Set<String> newChars, Set<String> top200NewChars, Set<String> stale30dChars,
    Set<String> stale7dChars, Set<String> stale1dChars, long notFoundCount, int totalCharsCount,
    double avgStalenessMs) {
  }

  private record UpdateQueue(Deque<String> queue, IndexerStats stats, long computedAtMs) {
  }

  /**
   * A precomputed priority entry to ensure stable sorting.
   */
  private record WeightedEntry(String fullName, double priority) {
  }
}
