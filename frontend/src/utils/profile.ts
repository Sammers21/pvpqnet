import { GamingHistoryEntry, Bracket } from "@/types";

function getSeasonTitle(achievement: string): { title: string; name: string } {
  return {
    title: achievement.split(":")[0],
    name: `Season ${parseInt(achievement.slice(-1), 10)}`,
  };
}

function getSeasonTitleDescription(
  title: string,
  seasonName: string,
  expansionName?: string
): string {
  const modernExpansions = [
    "The War Within",
    "Dragonflight",
    "Shadowlands",
    "Battle for Azeroth",
  ];
  const context = `${expansionName ?? ""} ${seasonName ?? ""}`.toLowerCase();
  const isModern = modernExpansions.some((e) =>
    context.includes(e.toLowerCase())
  );

  // Pre-Legion and Legion-era ladder-based wording
  if (!isModern) {
    if (title.includes("Gladiator")) {
      return "End PvP Season in the top 0.5% of the 3v3 arena ladder.";
    }
    if (title.includes("Elite")) {
      return "End PvP Season in the top 0.5% of the 3v3 arena ladder.";
    }
    if (title.includes("Duelist")) {
      return "End PvP Season in the top 3% of the 3v3 arena ladder.";
    }
    if (title.includes("Rival")) {
      return "End PvP Season in the top 10% of the 3v3 arena ladder.";
    }
    if (title.includes("Challenger")) {
      return "End PvP Season in the top 35% of the 3v3 arena ladder.";
    }
  }

  // Modern expansions (post-Legion): Gladiator is 50 wins at 2400+; R1 Gladiators remain ladder-based.
  if (title === "Gladiator") {
    const seasonLabel = seasonName || "the PvP Season";
    return `Win 50 games with more than 2400 arena rating during ${seasonLabel}.`;
  }
  if (title === "Legend") {
    return "Win 100 Rated Solo Shuffle rounds while at Elite rank during the PvP Season.";
  }
  if (title.includes("Gladiator")) {
    return "End PvP Season in the top 0.1% of the 3v3 arena ladder.";
  }
  if (title.includes("Legend")) {
    return "End PvP Season in the top 0.1% of the Solo Shuffle ladder.";
  }
  if (title.includes("Elite")) {
    return "Earn 2400 rating during the PvP Season.";
  }
  if (title.includes("Duelist")) {
    return "Earn between 2100 and 2399 rating during the PvP Season.";
  }
  if (title.includes("Rival")) {
    return "Earn between 1800 and 2099 rating during the PvP Season.";
  }
  if (title.includes("Challenger")) {
    return "Earn between 1600 and 1799 rating during the PvP season.";
  }
  return "";
}

export const getGamingHistoryRows = (bracket: Bracket) => {
  let rating = bracket?.rating;
  let rank = bracket?.rank;

  const populatedHistory = (bracket?.gaming_history?.history ?? [])
    .reverse()
    .map((history: GamingHistoryEntry) => {
      const result = { ...history, rating, rank };

      rating -= history.diff.rating_diff;
      rank -= history.diff.rank_diff;
      return result;
    });

  return populatedHistory.map((history: GamingHistoryEntry) => ({
    bracket_type: bracket?.bracket_type,
    RANK: history,
    WL: history.diff,
    RATING: history,
    WWHO: history.with_who,
    timestamp: history.diff.timestamp,
  }));
};

export { getSeasonTitle, getSeasonTitleDescription };
