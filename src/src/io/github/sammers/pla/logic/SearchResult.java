package io.github.sammers.pla.logic;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;
import java.util.Comparator;
import java.util.Objects;

public record SearchResult(String nick, String region, String clazz, String race, String highestAchievement,
  Integer highestAchievementTimes, Integer highestAchievementTier, Long bestRank, Long bestRating,
  String inBracket) implements JsonConvertable {

  // Tier constants - lower is better
  public static final int TIER_S = 0; // R1 in 3s, R1 in Solo, R1 in Blitz, Hero
  public static final int TIER_A = 1; // Gladiator, Legend, Strategist, Elite
  public static final int TIER_B = 2; // Duelist, Rival, Challenger, Combatant
  public static final int TIER_NONE = 99;
  /**
   * Comparator that sorts search results by: 1. Best rank (lower is better,
   * nulls/negatives last) 2. Best rating (higher is better, nulls/negatives last)
   * 3. Highest achievement tier (lower tier number is better)
   */
  public static final Comparator<SearchResult> RANK_RATING_ACHIEVEMENT_COMPARATOR = (a, b) -> {
    // First compare by rank (lower is better)
    boolean aHasRank = a.bestRank != null && a.bestRank > 0;
    boolean bHasRank = b.bestRank != null && b.bestRank > 0;
    if (aHasRank && bHasRank) {
      int rankCompare = Long.compare(a.bestRank, b.bestRank);
      if (rankCompare != 0)
        return rankCompare;
    } else if (aHasRank) {
      return -1;
    } else if (bHasRank) {
      return 1;
    }
    // Then compare by rating (higher is better)
    boolean aHasRating = a.bestRating != null && a.bestRating > 0;
    boolean bHasRating = b.bestRating != null && b.bestRating > 0;
    if (aHasRating && bHasRating) {
      int ratingCompare = Long.compare(b.bestRating, a.bestRating); // Note: reversed for higher-is-better
      if (ratingCompare != 0)
        return ratingCompare;
    } else if (aHasRating) {
      return -1;
    } else if (bHasRating) {
      return 1;
    }
    // Finally compare by achievement tier (lower tier is better)
    int aTier = a.highestAchievementTier != null ? a.highestAchievementTier : TIER_NONE;
    int bTier = b.highestAchievementTier != null ? b.highestAchievementTier : TIER_NONE;
    return Integer.compare(aTier, bTier);
  };
  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    SearchResult that = (SearchResult) o;
    return Objects.equals(nick, that.nick);
  }

  @Override
  public int hashCode() {
    return Objects.hashCode(nick);
  }

  @Override
  public JsonObject toJson() {
    JsonObject json = new JsonObject().put("nick", nick).put("region", region).put("class", clazz);
    if (race != null)
      json.put("race", race);
    if (highestAchievement != null)
      json.put("highest_achievement", highestAchievement);
    if (highestAchievementTimes != null)
      json.put("highest_achievement_times", highestAchievementTimes);
    if (highestAchievementTier != null)
      json.put("highest_achievement_tier", highestAchievementTier);
    if (bestRank != null && bestRank > 0)
      json.put("best_rank", bestRank);
    if (bestRating != null && bestRating > 0)
      json.put("best_rating", bestRating);
    if (inBracket != null)
      json.put("in_bracket", inBracket);
    return json;
  }
}
