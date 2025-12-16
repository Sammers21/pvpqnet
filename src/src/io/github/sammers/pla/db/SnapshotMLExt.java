package io.github.sammers.pla.db;

import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.logic.CharacterCache;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Extended Snapshot for multiclasser calculations. Contains CharacterMLExt
 * records with unique position (rank without alts).
 *
 * @param characters
 *          List of CharacterMLExt with posUniq calculated
 */
public record SnapshotMLExt(List<CharacterMLExt> characters) {
  /**
   * Creates an empty SnapshotMLExt.
   */
  public static SnapshotMLExt empty() {
    return new SnapshotMLExt(List.of());
  }

  /**
   * Creates a SnapshotMLExt from a Snapshot by calculating posUniq for each
   * character. posUniq is the rank of a character if we don't count alts (only
   * unique players).
   *
   * @param snapshot
   *          The original snapshot
   * @param cache
   *          The character cache to look up alt information
   * @return SnapshotMLExt with calculated posUniq values
   */
  public static SnapshotMLExt fromSnapshot(Snapshot snapshot, CharacterCache cache) {
    if (snapshot == null || snapshot.characters() == null || snapshot.characters().isEmpty()) {
      return empty();
    }
    List<Character> snapshotCharacters = snapshot.characters();
    // We need to calculate posUniq per spec, since shuffle leaderboards are
    // per-spec
    // Group characters by fullSpec
    Map<String, List<Character>> charactersBySpec = snapshotCharacters.stream()
      .collect(Collectors.groupingBy(Character::fullSpec));
    // For each spec, calculate posUniq
    Map<String, Long> characterToPosUniq = new HashMap<>();
    for (Map.Entry<String, List<Character>> entry : charactersBySpec.entrySet()) {
      List<Character> specCharacters = entry.getValue();
      // Sort by rating descending to maintain leaderboard order
      List<Character> sortedByRating = specCharacters.stream()
        .sorted(Comparator.comparing(Character::rating).reversed())
        .toList();
      // Track which players we've already seen (by petHash or fullName as fallback)
      Set<Integer> seenPlayers = new HashSet<>();
      long currentPosUniq = 0;
      for (Character character : sortedByRating) {
        WowAPICharacter wowAPICharacter = cache.getByFullName(character.fullName());
        // Determine unique identifier for this player
        Integer playerIdentifier;
        if (wowAPICharacter != null) {
          int petHash = wowAPICharacter.petHash();
          playerIdentifier = petHash == -1 ? character.fullName().hashCode() : petHash;
        } else {
          // Fallback to using pethash from character if available
          playerIdentifier = character.pethash().filter(p -> p != -1).orElse(character.fullName().hashCode());
        }
        // Only increment posUniq for unique players
        if (!seenPlayers.contains(playerIdentifier)) {
          seenPlayers.add(playerIdentifier);
          currentPosUniq++;
        }
        characterToPosUniq.put(character.fullNameWSpec(), currentPosUniq);
      }
    }
    // Create CharacterMLExt list preserving original order
    List<CharacterMLExt> extCharacters = snapshotCharacters.stream()
      .map(c -> new CharacterMLExt(c, characterToPosUniq.getOrDefault(c.fullNameWSpec(), c.pos())))
      .toList();
    return new SnapshotMLExt(extCharacters);
  }

  /**
   * Finds CharacterMLExt by full name.
   */
  public List<CharacterMLExt> findChar(String fullName) {
    return characters.stream().filter(c -> c.fullName().equals(fullName)).toList();
  }
}
