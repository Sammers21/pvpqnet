package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.db.Character;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
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

    public void upsertDiff(CharAndDiff diff) {
        Character character = diff.character();
        character.fullName();
        WowAPICharacter wowAPICharacter = nameCache.get(character.fullName());

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
        return alts.get(character.petHash());
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
