package io.github.sammers.pla;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

public record Cutoffs(String region, String season, Map<String, Long> cutoffs,
                      Long timestamp) implements JsonConvertable {

    public static Cutoffs fromBlizzardJson(String region, JsonObject entries) {
        final Map<String, Long> cfs = new HashMap<>();
        JsonArray rewards = entries.getJsonArray("rewards");
        for (int i = 0; i < rewards.size(); i++) {
            JsonObject reward = rewards.getJsonObject(i);
            String bracket = reward.getJsonObject("bracket").getString("type");
            if (bracket.equals("ARENA_3v3")) {
                cfs.put(bracket, reward.getLong("rating_cutoff"));
            } else if (bracket.equals("BATTLEGROUNDS")) {
                cfs.put(bracket + "/" + reward.getJsonObject("faction").getString("name").toLowerCase(), reward.getLong("rating_cutoff"));
            } else if (bracket.equals("SHUFFLE")) {
                cfs.put(bracket + "/" + reward.getJsonObject("specialization").getString("name").replaceAll(" ", "").toLowerCase(), reward.getLong("rating_cutoff"));
            } else {
                System.out.println("Unknown bracket: " + bracket);
            }
        }
        long now = System.currentTimeMillis();
        return new Cutoffs(
            region,
            entries.getJsonObject("season").getString("id"),
            cfs,
            now
        );
    }

    public Long threeVThree() {
        return cutoffs.get("ARENA_3v3");
    }

    public Long battlegrounds(String faction) {
        return cutoffs.get("BATTLEGROUNDS/" + faction.toLowerCase());
    }

    public Long shuffle(String specialization) {
        return cutoffs.get("SHUFFLE/" + specialization.toLowerCase());
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("region", region)
            .put("season", season)
            .put("rewards", new JsonObject(cutoffs.entrySet().stream().map(x -> Map.entry(x.getKey(), x.getValue())).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))));
    }
}