package io.github.sammers.pla.blizzard;

import java.util.List;
import java.util.Optional;

public enum BracketType {
  TWO_V_TWO(2, "2v2", "ARENA_2v2"), THREE_V_THREE(3, "3v3", "ARENA_3v3"), RBG(10, "BATTLEGROUNDS", "RBG"), SHUFFLE(1,
    "SHUFFLE"), BLITZ(1, "BLITZ");

  private final List<String> types;
  private final Integer partySize;

  private BracketType(Integer partySize, String... types) {
    this.partySize = partySize;
    this.types = List.of(types);
  }

  public Integer partySize() {
    return partySize;
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
