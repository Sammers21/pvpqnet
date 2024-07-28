package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.BracketType;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class CharacterCache {

    private final Map<Long, byte[]> idCache;
    private final Map<String, byte[]> nameCache;
    public final Map<Integer, Set<Long>> alts;
    public final RealmStats realmStats;

    public CharacterCache() {
        nameCache = new ConcurrentHashMap<>();
        idCache = new ConcurrentHashMap<>();
        alts = new ConcurrentHashMap<>();
        realmStats = new RealmStats();
    }

    public WowAPICharacter getByFullName(String name) {
        return WowAPICharacter.fromGzippedJson(nameCache.get(name));
    }

    public WowAPICharacter getById(Long id) {
        return WowAPICharacter.fromGzippedJson(idCache.get(id));
    }

    public void upsert(WowAPICharacter character) {
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
            WowAPICharacter updated = wowAPICharacter.updatePvpBracketData(
                diff,
                BracketType.fromType(bracket),
                withWho.stream().map(CharAndDiff::character).toList()
            );
            upsert(updated);
            res.add(updated);
        }
        return res;
    }

    public Set<WowAPICharacter> findAltsInconsistenciesAndFix(WowAPICharacter character) {
        Set<Long> idSet = new HashSet<>(character.alts());
        Set<WowAPICharacter> charset = new HashSet<>(idSet.stream().map(idCache::get).map(WowAPICharacter::fromGzippedJson).collect(Collectors.toSet()));
        charset.add(character);
        charset.forEach(ch -> idSet.add(ch.id()));
        Set<WowAPICharacter> resl = charset.stream().filter(ch -> {
            var specificSet = new HashSet<>(idSet);
            specificSet.remove(ch.id());
            boolean eq = !specificSet.equals(ch.alts());
            return eq;
        }).collect(Collectors.toSet());
        Set<WowAPICharacter> resm = resl.stream().map(ch -> {
            Set<Long> longs = new HashSet<>(idSet);
            longs.remove(ch.id());
            WowAPICharacter changedAlts = ch.changeAlts(longs);
            return changedAlts;
        }).collect(Collectors.toSet());
            return resm;
    }

    public Collection<byte[]> values() {
        return idCache.values();
    }

    public Set<WowAPICharacter> altsFor(WowAPICharacter character) {
        Set<Long> longs = Optional.ofNullable(alts.get(character.petHash())).orElse(new HashSet<>());
        longs.addAll(character.alts());
        return Optional.of(longs.stream().map(idCache::get).map(WowAPICharacter::fromGzippedJson)
                .collect(Collectors.toSet()))
            .orElse(Set.of())
            .stream()
            .filter(c -> !c.hidden())
            .collect(Collectors.toSet());
    }

    public static void indexCharAlts(Map<Integer, Set<Long>> alts, Long charId, int petHash) {
        alts.compute(petHash, (key, value) -> {
            if (key == -1) {
                return null;
            }
            if (value == null) {
                value = new TreeSet<>();
            }
            value.remove(charId);
            value.add(charId);
            return value;
        });
    }
}
