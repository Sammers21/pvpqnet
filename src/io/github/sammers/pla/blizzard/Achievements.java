package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;
import org.javatuples.Pair;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public record Achievements(Long totalQuantity,
                           Long totalPoints,
                           Set<Achievement> achievements,
                           TitlesHistory titlesHistory
                        ) implements JsonConvertable {

    public static Achievements parse(JsonObject achievements) {
        Set<Achievement> set = achievements.getJsonArray("achievements")
            .stream()
            .map(JsonObject.class::cast)
            .map(Achievement::parse)
            .filter(Achievements::isPvpAchievement)
            .collect(Collectors.toSet());
        TitlesHistory titlesHistory = calculateTitlesHistory(set);
        return new Achievements(
            achievements.getLong("total_quantity"),
            achievements.getLong("total_points"),
            set,
            titlesHistory
        );
    }

    public static Achievements fromJson(JsonObject json) {
        if (json == null || json.fieldNames().size() == 0) {
            return new Achievements(0L, 0L, Set.of(), TitlesHistory.parse(null));
        }
        TitlesHistory titlesHistory = TitlesHistory.parse(json.getJsonObject("titles_history"));
        return new Achievements(
            json.getLong("total_quantity"),
            json.getLong("total_points"),
            json.getJsonArray("achievements")
                .stream()
                .map(JsonObject.class::cast)
                .map(Achievement::fromJson)
                .collect(Collectors.toSet()),
            titlesHistory
        );
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("total_quantity", totalQuantity)
            .put("total_points", totalPoints)
            .put("achievements", achievements.stream().map(Achievement::toJson).collect(Collectors.toList()))
            .put("titles_history", titlesHistory.toJson());
    }

    private static Pattern OldRankOnePattern = Pattern.compile("^(\\w+) Gladiator$");
    private static Pattern NewRankOnePattern = Pattern.compile("^(\\w+) Gladiator: ([\\w\\s]+) Season (\\d+)$");
    private static Pattern ShuffleRankOnePattern = Pattern.compile("^(\\w+) Legend: ([\\w\\s]+) Season (\\d+)$");
    private static Set<String> ArenaRanks = Set.of("Gladiator", "Duelist", "Rival", "Challenger", "Legend", "Elite" , "Combatant");
    private static String ArenaRanksString = String.join("|", ArenaRanks);
    private static Pattern NewLowRanks = Pattern.compile("^(" + ArenaRanksString + "): ([\\w\\s]+) Season (\\d+)$");
    private static Pattern OldLowRanks = Pattern.compile("^(" + ArenaRanksString + ")$");

    private static boolean isPvpAchievement(Achievement achievement) {
        String name = achievement.name();
        Matcher oldR1 = OldRankOnePattern.matcher(name);
        Matcher newR1 = NewRankOnePattern.matcher(name);
        Matcher shuffleR1 = ShuffleRankOnePattern.matcher(name);
        Matcher newLowRanks = NewLowRanks.matcher(name);
        Matcher oldLowRanks = OldLowRanks.matcher(name);
        return oldR1.matches()
            || newR1.matches()
            || shuffleR1.matches()
            || newLowRanks.matches()
            || oldLowRanks.matches();
    }

    private static Map<String, Long> rankToLong = Map.of(
        "r1_3s", 120L,
        "r1_shuffle", 110L,
        "Gladiator", 100L,
        "Legend", 90L,
        "Elite", 80L,
        "Duelist", 70L,
        "Rival", 60L,
        "Challenger", 50L,
        "Combatant", 40L
    );

    private static TitlesHistory calculateTitlesHistory(Set<Achievement> achievements) {
        // Expansion -> Map<SeasonName, Pair<Rank, Season>>
        Map<String, Map<Long, Pair<String, Season>>> expansions = new HashMap<>();
        achievements.stream().forEach(achievement -> {
            Matcher newR1 = NewRankOnePattern.matcher(achievement.name());
            if (newR1.find()) {
                String rank = "r1_3s";
                String seasonName = newR1.group(2);
                Long seasonNumber = Long.parseLong(newR1.group(3));
                updateSeasons(expansions, achievement, rank, seasonName, seasonNumber);
            }
            Matcher shuffleR1 = ShuffleRankOnePattern.matcher(achievement.name());
            if (shuffleR1.find()) {
                String rank = "r1_shuffle";
                String seasonName = shuffleR1.group(2);
                Long seasonNumber = Long.parseLong(shuffleR1.group(3));
                updateSeasons(expansions, achievement, rank, seasonName, seasonNumber);
            }
            Matcher newLowRanks = NewLowRanks.matcher(achievement.name());
            if (newLowRanks.find()) {
                String rank = newLowRanks.group(1);
                String seasonName = newLowRanks.group(2);
                Long seasonNumber = Long.parseLong(newLowRanks.group(3));
                updateSeasons(expansions, achievement, rank, seasonName, seasonNumber);
            }
        });
        Map<String, Long> expansionAndMaxTimestamp = new HashMap<>();
        expansions.forEach((expansion, expansionMap) -> {
            Long maxTimestamp = expansionMap.values().stream().map(Pair::getValue1)
                .map(Season::highestAchievement)
                .map(Achievement::completedTimestamp)
                .filter(Objects::nonNull)
                .max(Long::compareTo)
                .orElse(0L);
            expansionAndMaxTimestamp.put(expansion, maxTimestamp);
        });
        return new TitlesHistory(expansions.keySet().stream()
            .sorted(Comparator.comparing(expansionAndMaxTimestamp::get).reversed())
            .map(expansion -> {
                Map<Long, Pair<String, Season>> expansionMap = expansions.get(expansion);
                List<Season> seasonsList = expansionMap.keySet().stream().map(seasonNumber -> {
                    Pair<String, Season> pair = expansionMap.get(seasonNumber);
                    return pair.getValue1();
                }).collect(Collectors.toList());
                return new Expansion(expansion, seasonsList);
            }).collect(Collectors.toList()));
    }

    private static void updateSeasons(Map<String, Map<Long, Pair<String, Season>>> seasons, Achievement achievement, String rank, String expansion, Long seasonNumber) {
        seasons.compute(expansion, (key, expansionMap) -> {
            if (expansionMap == null) {
                Map<Long, Pair<String, Season>> ssnMap = new HashMap<>();
                ssnMap.put(seasonNumber, new Pair<>(rank, new Season(expansion, achievement, rank, List.of())));
                return ssnMap;
            } else {
                expansionMap.compute(seasonNumber, (key2, seasonMap) -> {
                    if (seasonMap == null) {
                        return new Pair<>(rank, new Season(expansion, achievement, rank, List.of()));
                    } else if (rankToLong.get(rank) > rankToLong.get(seasonMap.getValue0())) {
                        return new Pair<>(rank, new Season(expansion, achievement, rank, List.of()));
                    } else {
                        return seasonMap;
                    }
                });
                return expansionMap;
            }
        });
    }
}
