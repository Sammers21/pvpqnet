package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.WowAPICharacter;

import java.util.Map;

public class CharSearchIndex {

    private final Map<String, WowAPICharacter> characterCache;

    public CharSearchIndex(Map<String, WowAPICharacter> characterCache){
        this.characterCache = characterCache;
    }


}
