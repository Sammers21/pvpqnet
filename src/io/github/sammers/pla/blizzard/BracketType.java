package io.github.sammers.pla.blizzard;

import java.util.List;
import java.util.Optional;

public enum BracketType {
    TWO_V_TWO("2v2", "ARENA_2v2"),
    THREE_V_THREE("3v3", "ARENA_3v3"),
    RBG("BATTLEGROUNDS", "RBG"),

    SHUFFLE("SHUFFLE");

    private final List<String> types;

    private BracketType(String... types) {
        this.types = List.of(types);
    }

    public static BracketType fromType(String type) {
        String lowerCase = type.toLowerCase();
        for (BracketType bracketType : values()) {
            Optional<String> first = bracketType.types.stream()
                .filter(t -> t.toLowerCase().equals(lowerCase) || lowerCase.contains(t.toLowerCase()))
                .findFirst();
            if (first.isPresent()) {
                return bracketType;
            }
        }
        throw new IllegalArgumentException("Unknown bracket type: " + type);
    }
}
