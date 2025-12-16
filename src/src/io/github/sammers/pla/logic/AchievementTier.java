package io.github.sammers.pla.logic;

import io.github.sammers.pla.blizzard.Achievement;
import io.github.sammers.pla.blizzard.Achievements;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Helper class to calculate achievement tiers and extract highest achievement
 * info. Tier S (0): R1 in 3s, R1 in Solo Shuffle, R1 in Blitz, Hero Tier A (1):
 * Gladiator, Legend, Strategist, Elite Tier B (2): Duelist, Rival, Challenger,
 * Combatant
 */
public class AchievementTier {
  // Patterns for matching achievements
  private static final Pattern R1_3S_PATTERN = Pattern.compile("^(\\w+) Gladiator: ([\\w\\s]+) Season (\\d+)$");
  private static final Pattern R1_SHUFFLE_PATTERN = Pattern.compile("^(\\w+) Legend: ([\\w\\s]+) Season (\\d+)$");
  private static final Pattern R1_BLITZ_PATTERN = Pattern
    .compile("^(\\w+) (Marshal|Warlord): ([\\w\\s]+) Season (\\d+)$");
  private static final Pattern HERO_PATTERN = Pattern.compile("^Hero of the (Alliance|Horde): (.+)$");
  private static final Pattern GLADIATOR_PATTERN = Pattern.compile("^Gladiator: .+$");
  private static final Pattern LEGEND_PATTERN = Pattern.compile("^Legend: .+$");
  private static final Pattern STRATEGIST_PATTERN = Pattern.compile("^Strategist: .+$");
  private static final Pattern ELITE_PATTERN = Pattern.compile("^Elite: .+$");
  private static final Pattern DUELIST_PATTERN = Pattern.compile("^Duelist: .+$");
  private static final Pattern RIVAL_PATTERN = Pattern.compile("^Rival: .+$");
  private static final Pattern CHALLENGER_PATTERN = Pattern.compile("^Challenger: .+$");
  private static final Pattern COMBATANT_PATTERN = Pattern.compile("^Combatant: .+$");
  // Achievement names for display
  public static final String R1_3S = "Rank 1 in 3v3";
  public static final String R1_SHUFFLE = "Rank 1 in Solo";
  public static final String R1_BLITZ = "Rank 1 in Blitz";
  public static final String HERO = "Hero";
  public static final String GLADIATOR = "Gladiator";
  public static final String LEGEND = "Legend";
  public static final String STRATEGIST = "Strategist";
  public static final String ELITE = "Elite";
  public static final String DUELIST = "Duelist";
  public static final String RIVAL = "Rival";
  public static final String CHALLENGER = "Challenger";
  public static final String COMBATANT = "Combatant";
  // Achievement order for comparison (lower index = better achievement)
  private static final List<String> ACHIEVEMENT_ORDER = List.of(R1_3S, R1_SHUFFLE, R1_BLITZ, HERO, // Tier S
    GLADIATOR, LEGEND, STRATEGIST, ELITE, // Tier A
    DUELIST, RIVAL, CHALLENGER, COMBATANT // Tier B
  );

  public record AchievementInfo(String name, int count, int tier) {
  }

  /**
   * Get the tier for a given achievement name.
   */
  public static int getTier(String achievementName) {
    if (achievementName == null)
      return SearchResult.TIER_NONE;
    return switch (achievementName) {
      case R1_3S, R1_SHUFFLE, R1_BLITZ, HERO -> SearchResult.TIER_S;
      case GLADIATOR, LEGEND, STRATEGIST, ELITE -> SearchResult.TIER_A;
      case DUELIST, RIVAL, CHALLENGER, COMBATANT -> SearchResult.TIER_B;
      default -> SearchResult.TIER_NONE;
    };
  }

  /**
   * Categorize a raw achievement name to a standardized category.
   */
  public static String categorizeAchievement(String rawName) {
    if (rawName == null)
      return null;
    if (R1_3S_PATTERN.matcher(rawName).matches())
      return R1_3S;
    if (R1_SHUFFLE_PATTERN.matcher(rawName).matches())
      return R1_SHUFFLE;
    if (R1_BLITZ_PATTERN.matcher(rawName).matches())
      return R1_BLITZ;
    if (HERO_PATTERN.matcher(rawName).matches())
      return HERO;
    if (GLADIATOR_PATTERN.matcher(rawName).matches())
      return GLADIATOR;
    if (LEGEND_PATTERN.matcher(rawName).matches())
      return LEGEND;
    if (STRATEGIST_PATTERN.matcher(rawName).matches())
      return STRATEGIST;
    if (ELITE_PATTERN.matcher(rawName).matches())
      return ELITE;
    if (DUELIST_PATTERN.matcher(rawName).matches())
      return DUELIST;
    if (RIVAL_PATTERN.matcher(rawName).matches())
      return RIVAL;
    if (CHALLENGER_PATTERN.matcher(rawName).matches())
      return CHALLENGER;
    if (COMBATANT_PATTERN.matcher(rawName).matches())
      return COMBATANT;
    return null;
  }

  /**
   * Extract the highest achievement info from a WowAPICharacter. Returns the
   * highest tier achievement with its count.
   */
  public static AchievementInfo extractHighestAchievement(WowAPICharacter character) {
    if (character == null || character.achievements() == null) {
      return null;
    }
    Achievements achievements = character.achievements();
    if (achievements.achievements() == null || achievements.achievements().isEmpty()) {
      return null;
    }
    // Count achievements by category
    Map<String, Integer> achievementCounts = new HashMap<>();
    for (Achievement achievement : achievements.achievements()) {
      String category = categorizeAchievement(achievement.name());
      if (category != null) {
        achievementCounts.merge(category, 1, Integer::sum);
      }
    }
    if (achievementCounts.isEmpty()) {
      return null;
    }
    // Find the best achievement (lowest index in ACHIEVEMENT_ORDER)
    String bestAchievement = null;
    int bestIndex = Integer.MAX_VALUE;
    for (String category : achievementCounts.keySet()) {
      int index = ACHIEVEMENT_ORDER.indexOf(category);
      if (index >= 0 && index < bestIndex) {
        bestIndex = index;
        bestAchievement = category;
      }
    }
    if (bestAchievement == null) {
      return null;
    }
    int count = achievementCounts.get(bestAchievement);
    int tier = getTier(bestAchievement);
    return new AchievementInfo(bestAchievement, count, tier);
  }
}
