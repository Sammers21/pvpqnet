package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.BracketType;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;
import io.prometheus.metrics.core.metrics.Gauge;
import org.javatuples.Pair;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class CharacterCache {
  private final Map<Long, byte[]> idCache;
  private final Map<String, byte[]> nameCache;
  public final Map<Integer, Set<Long>> alts;
  public final RealmStats realmStats;
  private static final Gauge ID_CACHE_SIZE = Gauge.builder()
    .name("IdGzipCacheSize")
    .help("How many characters are " + "in the id cache")
    .labelNames()
    .register();

  public CharacterCache() {
    nameCache = new ConcurrentHashMap<>();
    idCache = new ConcurrentHashMap<>();
    alts = new ConcurrentHashMap<>();
    realmStats = new RealmStats();
  }

  public void calculateSizeMetrics() {
    long bytes = idCache.values().stream().mapToLong(b -> b.length).sum();
    ID_CACHE_SIZE.set(bytes);
  }

  public WowAPICharacter getByFullName(String name) {
    return WowAPICharacter.fromGzippedJson(nameCache.get(name));
  }

  public WowAPICharacter getById(Long id) {
    return WowAPICharacter.fromGzippedJson(idCache.get(id));
  }

  public void remove(WowAPICharacter character) {
    if (character == null) {
      return;
    }
    nameCache.remove(character.fullName());
    idCache.remove(character.id());
    int petHash = character.petHash();
    if (petHash != -1) {
      alts.computeIfPresent(petHash, (k, v) -> {
        v.remove(character.id());
        return v.isEmpty() ? null : v;
      });
    }
  }

  public void removeById(Long id) {
    WowAPICharacter character = getById(id);
    if (character != null) {
      remove(character);
    } else {
      idCache.remove(id);
    }
  }

  public void upsert(WowAPICharacter character) {
    if (character == null) {
      return;
    }
    if (character.hidden()) {
      remove(character);
      return;
    }
    byte[] gzip = character.toGzippedJson();
    int ncsize = nameCache.size();
    nameCache.put(character.fullName(), gzip);
    idCache.put(character.id(), gzip);
    indexCharAlts(alts, character.id(), character.petHash());
    if (ncsize != nameCache.size()) {
      realmStats.addRealmStat(character.realm(), character.region(), 1);
    }
  }

  public Optional<WowAPICharacter> upsertDiff(CharAndDiff diff, String bracket) {
    Character character = diff.character();
    WowAPICharacter wowAPICharacter = this.getByFullName(character.fullName());
    if (wowAPICharacter == null) {
      return Optional.empty();
    }
    WowAPICharacter updated = wowAPICharacter.updatePvpBracketData(diff, BracketType.fromType(bracket), List.of());
    upsert(updated);
    return Optional.of(updated);
  }

  public List<WowAPICharacter> upsertGroupDiff(List<CharAndDiff> groupDiff, String bracket) {
    List<WowAPICharacter> res = new ArrayList<>();
    for (int i = 0; i < groupDiff.size(); i++) {
      CharAndDiff diff = groupDiff.get(i);
      Character character = diff.character();
      WowAPICharacter wowAPICharacter = getByFullName(character.fullName());
      if (wowAPICharacter == null) {
        continue;
      }
      List<CharAndDiff> withWho = new ArrayList<>(groupDiff.subList(0, i));
      withWho.addAll(groupDiff.subList(i + 1, groupDiff.size()));
      WowAPICharacter updated = wowAPICharacter.updatePvpBracketData(diff, BracketType.fromType(bracket),
        withWho.stream().map(CharAndDiff::character).toList());
      upsert(updated);
      res.add(updated);
    }
    return res;
  }

  public Set<WowAPICharacter> findAltsInconsistenciesAndFix(WowAPICharacter character) {
    Set<Long> idSet = new HashSet<>(character.alts());
    Set<WowAPICharacter> charset = idSet.stream()
      .map(idCache::get)
      .map(WowAPICharacter::fromGzippedJson)
      .filter(Objects::nonNull)
      .collect(Collectors.toSet());
    charset.add(character);
    charset.forEach(ch -> idSet.add(ch.id()));
    Set<WowAPICharacter> resl = charset.stream().filter(ch -> {
      var specificSet = new HashSet<>(idSet);
      specificSet.remove(ch.id());
      return !specificSet.equals(ch.alts());
    }).collect(Collectors.toSet());
    Set<WowAPICharacter> resm = resl.stream().map(ch -> {
      Set<Long> longs = new HashSet<>(idSet);
      longs.remove(ch.id());
      WowAPICharacter changedAlts = ch.changeAlts(longs);
      return changedAlts;
    }).collect(Collectors.toSet());
    return resm;
  }

  /**
   * @return ids of chars to delete and chars to update
   */
  public Pair<Set<Long>, Set<WowAPICharacter>> removeNickDuplicates(WowAPICharacter character) {
    List<WowAPICharacter> sameNickButDiffId = new ArrayList<>(character.alts()
      .stream()
      .flatMap(id -> Stream.ofNullable(idCache.get(id)))
      .map(WowAPICharacter::fromGzippedJson)
      .filter(idLookedUp -> idLookedUp.fullName().equalsIgnoreCase(character.fullName()))
      .toList());
    sameNickButDiffId.add(character);
    List<WowAPICharacter> all = new ArrayList<>(
      sameNickButDiffId.stream().sorted(Comparator.comparingLong(WowAPICharacter::lastUpdatedUTCms)).toList());
    WowAPICharacter newest = all.removeLast();
    Set<Long> toDelete = all.stream().map(WowAPICharacter::id).collect(Collectors.toSet());
    toDelete.remove(newest.id());
    Set<WowAPICharacter> toUpdate = new HashSet<>();
    toUpdate.add(newest);
    toUpdate.addAll(newest.alts()
      .stream()
      .flatMap(id -> Stream.ofNullable(idCache.get(id)))
      .map(WowAPICharacter::fromGzippedJson)
      .filter(ch -> !toDelete.contains(ch.id()))
      .map(ch -> {
        var cur = ch.alts();
        cur.removeAll(toDelete);
        return ch.changeAlts(cur);
      })
      .collect(Collectors.toSet()));
    return new Pair<>(toDelete, toUpdate);
  }

  public Collection<byte[]> values() {
    return idCache.values();
  }

  public int size() {
    return idCache.size();
  }

  /**
   * Counts characters by region.
   *
   * @param region
   *          The region to count (e.g., "eu", "us")
   * @return The number of characters in that region
   */
  public int countByRegion(String region) {
    return (int) idCache.values()
      .stream()
      .map(WowAPICharacter::fromGzippedJson)
      .filter(Objects::nonNull)
      .filter(c -> region.equalsIgnoreCase(c.region()))
      .count();
  }

  public Set<WowAPICharacter> altsFor(WowAPICharacter character) {
    Set<Long> longs = new HashSet<>();
    Set<Long> cached = alts.get(character.petHash());
    if (cached != null) {
      longs.addAll(cached);
    }
    longs.addAll(character.alts());
    return longs.stream()
      .map(idCache::get)
      .map(WowAPICharacter::fromGzippedJson)
      .filter(Objects::nonNull)
      .filter(c -> !c.hidden())
      .collect(Collectors.toSet());
  }

  public static void indexCharAlts(Map<Integer, Set<Long>> alts, Long charId, int petHash) {
    alts.compute(petHash, (key, value) -> {
      if (key == -1) {
        return null;
      }
      if (value == null) {
        value = ConcurrentHashMap.newKeySet();
      }
      value.remove(charId);
      value.add(charId);
      return value;
    });
  }
}
