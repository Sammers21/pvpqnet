package io.github.sammers.pla.blizzard;

import java.util.List;

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
        for (BracketType bracketType : values()) {
            if (bracketType.types.contains(type.toUpperCase())) {
                return bracketType;
            }
        }
        throw new IllegalArgumentException("Unknown bracket type: " + type);
    }
}
