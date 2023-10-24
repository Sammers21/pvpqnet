package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.BracketType;
import io.github.sammers.pla.blizzard.PvpBracket;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class CharacterCache {

    private final Map<Long, WowAPICharacter> idCache;
    private final Map<String, WowAPICharacter> nameCache;
    private final Map<Integer, Set<WowAPICharacter>> alts = new ConcurrentHashMap<>();

    public CharacterCache() {
        nameCache = new ConcurrentHashMap<>();
        idCache = new ConcurrentHashMap<>();
    }

    public WowAPICharacter getByFullName(String name) {
        return nameCache.get(name);
    }

    public WowAPICharacter getById(Long id) {
        return idCache.get(id);
    }

    public void upsert(WowAPICharacter character) {
        nameCache.put(character.fullName(), character);
        idCache.put(character.id(), character);
        indexCharAlts(alts, character);
    }

    public Optional<WowAPICharacter> upsertDiff(CharAndDiff diff, String bracket) {
        Character character = diff.character();
        WowAPICharacter wowAPICharacter = nameCache.get(character.fullName());
        if(wowAPICharacter == null) {
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
            WowAPICharacter wowAPICharacter = nameCache.get(character.fullName());
            if(wowAPICharacter == null) {
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

    public Collection<WowAPICharacter> values() {
        return idCache.values();
    }

    public Map<String, WowAPICharacter> nameCache() {
        return nameCache;
    }

    public Map<Long, WowAPICharacter> idCache() {
        return idCache;
    }

    public Set<WowAPICharacter> altsFor(WowAPICharacter character) {
        return alts.get(character.petHash()).stream().filter(c -> !c.hidden()).collect(Collectors.toSet());
    }

    public static void indexCharAlts(Map<Integer, Set<WowAPICharacter>> alts, WowAPICharacter character) {
        int hash = character.petHash();
        alts.compute(hash, (key, value) -> {
            if (key == -1) {
                return null;
            }
            if (value == null) {
                value = new TreeSet<>(Comparator.comparing(WowAPICharacter::id));
            }
            value.remove(character);
            value.add(character);
            return value;
        });
    }
}
