package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public record Achievements(Long totalQuantity,
                           Long totalPoints,
                           Set<Achievement> achievements
                        ) implements JsonConvertable {

    public static Achievements parse(JsonObject achievements) {
        return new Achievements(
            achievements.getLong("total_quantity"),
            achievements.getLong("total_points"),
            achievements.getJsonArray("achievements")
                .stream()
                .map(JsonObject.class::cast)
                .map(Achievement::parse)
                .filter(Achievements::isPvpAchievement)
                .collect(Collectors.toSet())
        );
    }

    public static Achievements fromJson(JsonObject json) {
        if (json == null || json.fieldNames().size() == 0) {
            return new Achievements(0L, 0L, Set.of());
        }
        return new Achievements(
            json.getLong("total_quantity"),
            json.getLong("total_points"),
            json.getJsonArray("achievements")
                .stream()
                .map(JsonObject.class::cast)
                .map(Achievement::fromJson)
                .collect(Collectors.toSet())
        );
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("total_quantity", totalQuantity)
            .put("total_points", totalPoints)
            .put("achievements", achievements.stream().map(Achievement::toJson).collect(Collectors.toList()));
    }

    private static Pattern OldRankOnePattern = Pattern.compile("^(\\w+) Gladiator$");
    private static Pattern NewRankOnePattern = Pattern.compile("^(\\w+) Gladiator: ([\\w\\s]+) Season (\\d+)$");
    private static Pattern ShuffleRankOnePattern = Pattern.compile("^(\\w+) Legend: ([\\w\\s]+) Season (\\d+)$");
    private static Set<String> ArenaRanks = Set.of("Gladiator", "Duelist", "Rival", "Challenger", "Legend");
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
}
