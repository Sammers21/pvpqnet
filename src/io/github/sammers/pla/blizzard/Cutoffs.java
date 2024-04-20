package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import static io.github.sammers.pla.logic.Conts.SPACE;

public class Cutoffs implements JsonConvertable {

    public final String region;
    public final String season;
    public final Map<String, Long> cutoffs;
    public final Long timestamp;
    public final Map<String, Long> spotsCounts = new HashMap<>();
    public final Map<String, Long> spotWithNoAlts = new HashMap<>();

    public Cutoffs(String region, String season, Map<String, Long> cutoffs, Long timestamp) {
        this.region = region;
        this.season = season;
        this.cutoffs = cutoffs;
        this.timestamp = timestamp;
    }

    public Cutoffs(
        String region,
        String season,
        Map<String, Long> cutoffs,
        Map<String, Long> spotsCounts,
        Map<String, Long> spotWithNoAlts,
        Long timestamp) {
        this(region, season, cutoffs, timestamp);
        this.spotsCounts.putAll(spotsCounts);
        this.spotWithNoAlts.putAll(spotWithNoAlts);
    }

    public void setSpotWithNoAlts(String bracket, long count) {
        spotWithNoAlts.put(bracket, (long)count);
    }

    public void setSpotCount(String bracket, int count) {
        spotsCounts.put(bracket, (long)count);
    }

    public int spotCount(String bracket) {
        Long res = spotsCounts.getOrDefault(bracket, 0L);
        return res.intValue();
    }

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
                String spec = reward.getJsonObject("specialization").getString("name");
                Long id = reward.getJsonObject("specialization").getLong("id");
                cfs.put(bracket + "/" + specCodeNameById(spec, id), reward.getLong("rating_cutoff"));
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

    public static String specCodeNameById(String spec, Long id) {
        switch (spec) {
            case "Frost" -> {
                if (id == 251) {
                    return "frostd";
                } else {
                    return "frostm";
                }
            }
            case "Holy" -> {
                if (id == 65) {
                    return "holypala";
                } else {
                    return "holypri";
                }
            }
            case "Restoration" -> {
                if (id == 105) {
                    return "restodruid";
                } else {
                    return "restosham";
                }
            }
            default -> {
                return SPACE.matcher(spec).replaceAll("").toLowerCase();
            }
        }
    }

    public static String specCodeByFullName(String fullName) {
        String spec = fullName.toLowerCase().split(" ")[0];
        return switch (fullName) {
            case "Frost Mage" -> "frostm";
            case "Frost Death Knight" -> "frostd";
            case "Holy Paladin" -> "holypala";
            case "Holy Priest" -> "holypri";
            case "Beast Mastery Hunter" -> "beastmastery";
            case "Restoration Druid" -> "restodruid";
            case "Restoration Shaman" -> "restosham";
            default -> spec;
        };
    }

    public Long threeVThree() {
        return cutoffs.get("ARENA_3v3");
    }

    public Long battlegrounds(String faction) {
        return cutoffs.get("BATTLEGROUNDS/" + faction.toLowerCase());
    }

    public Long battlegrounds() {
        return battlegrounds("alliance");
    }

    public Long shuffle(String specialization) {
        return cutoffs.get("SHUFFLE/" + specialization.toLowerCase());
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
                .put("region", region)
                .put("season", season)
                .put("timestamp", timestamp)
                .put("rewards", new JsonObject(cutoffs.entrySet().stream().map(x -> Map.entry(x.getKey(), x.getValue())).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))))
                .put("spotCounts", new JsonObject(spotsCounts.entrySet().stream().map(x -> Map.entry(x.getKey(), x.getValue())).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))))
                .put("spotWithNoAlts", new JsonObject(spotWithNoAlts.entrySet().stream().map(x -> Map.entry(x.getKey(), x.getValue())).collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))));
    }

    public static Cutoffs fromJson(JsonObject json) {
        return new Cutoffs(
                json.getString("region"),
                json.getString("season"),
                json.getJsonObject("rewards").stream().collect(Collectors.toMap(Map.Entry::getKey, x -> (Long) x.getValue())),
                json.getJsonObject("spotCounts").stream().collect(Collectors.toMap(Map.Entry::getKey, x -> (Long) x.getValue())),
                json.getJsonObject("spotWithNoAlts").stream().collect(Collectors.toMap(Map.Entry::getKey, x -> (Long) x.getValue())),
                json.getLong("timestamp")
        );
    }

    public Long cutoffByBracketType(String btype) {
        if (btype.equals("ARENA_2v2")) {
            return Long.MAX_VALUE;
        } else if (btype.equals("BATTLEGROUNDS")) {
            return battlegrounds();
        } else if (btype.equals("ARENA_3v3")) {
            return cutoffs.get(btype);
        }
        return cutoffs.get(btype);
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof Cutoffs) {
            Cutoffs other = (Cutoffs) obj;
            return region.equals(other.region) 
                    && season.equals(other.season)
                    && cutoffs.equals(other.cutoffs);
        }
        return false;
    }
}
