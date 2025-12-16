package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.slf4j.Logger;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import static io.github.sammers.pla.logic.Conts.SPACE;

public class Cutoffs implements JsonConvertable {
  private static final Logger log = org.slf4j.LoggerFactory.getLogger(Cutoffs.class);
  public final String region;
  public final String season;
  public final Map<String, Long> cutoffs;
  public final Map<String, Long> cutoffsPredictions = new HashMap<>();
  public final Long timestamp;
  public final Map<String, Long> spotsCounts = new HashMap<>();
  public final Map<String, Long> spotWithNoAlts = new HashMap<>();

  public Cutoffs(String region, String season, Map<String, Long> cutoffs, Long timestamp) {
    this.region = region;
    this.season = season;
    this.cutoffs = cutoffs;
    this.timestamp = timestamp;
  }

  public Cutoffs(String region, String season, Map<String, Long> cutoffs, Map<String, Long> spotsCounts,
    Map<String, Long> spotWithNoAlts, Long timestamp) {
    this(region, season, cutoffs, timestamp);
    this.spotsCounts.putAll(spotsCounts);
    this.spotWithNoAlts.putAll(spotWithNoAlts);
  }

  public void setPrediction(String bracket, long rating) {
    cutoffsPredictions.put(bracket, rating);
  }

  public void setSpotWithNoAlts(String bracket, long count) {
    spotWithNoAlts.put(bracket, (long) count);
  }

  public void setSpotCount(String bracket, int count) {
    spotsCounts.put(bracket, (long) count);
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
      switch (bracket) {
        case "ARENA_3v3" -> cfs.put(bracket, reward.getLong("rating_cutoff"));
        case "BATTLEGROUNDS" -> cfs.put(bracket + "/" + reward.getJsonObject("faction").getString("name").toLowerCase(),
          reward.getLong("rating_cutoff"));
        case "SHUFFLE", "BLITZ" -> {
          String spec = reward.getJsonObject("specialization").getString("name");
          Long id = reward.getJsonObject("specialization").getLong("id");
          cfs.put(bracket + "/" + specCodeNameById(spec, id), reward.getLong("rating_cutoff"));
        }
        default -> log.error("Unknown bracket type: " + bracket);
      }
    }
    long now = System.currentTimeMillis();
    return new Cutoffs(region, entries.getJsonObject("season").getString("id"), cfs, now);
  }

  public static String specCodeNameById(String spec, Long id) {
    switch (spec) {
      case "Protection" -> {
        if (id == 66) {
          return "protpaladin";
        } else {
          return "protwarrior";
        }
      }
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

  /**
   * Normalizes spec names to handle inconsistencies like "Beastmastery Hunter" vs
   * "Beast Mastery Hunter". Returns a lowercase, space-free version for
   * comparison purposes.
   */
  public static String normalizeSpecName(String specName) {
    if (specName == null)
      return "";
    return specName.toLowerCase().replaceAll("\\s+", "");
  }

  /**
   * Checks if two spec names match, handling format inconsistencies. E.g., "Beast
   * Mastery Hunter" matches "Beastmastery Hunter"
   */
  public static boolean specNamesMatch(String spec1, String spec2) {
    return normalizeSpecName(spec1).equals(normalizeSpecName(spec2));
  }

  /**
   * Checks if fullSpec contains the given spec name, handling format
   * inconsistencies. E.g., "Beastmastery Hunter".contains("Beast Mastery") would
   * normally be false, but this method returns true.
   */
  public static boolean fullSpecContainsSpec(String fullSpec, String spec) {
    if (fullSpec == null || spec == null)
      return false;
    return normalizeSpecName(fullSpec).contains(normalizeSpecName(spec));
  }

  public static String specCodeByFullName(String fullName) {
    String normalized = normalizeSpecName(fullName);
    String spec = fullName.toLowerCase().split(" ")[0];
    // Handle known special cases using normalized comparison
    if (normalized.equals("frostmage"))
      return "frostm";
    if (normalized.equals("frostdeathknight"))
      return "frostd";
    if (normalized.equals("holypaladin"))
      return "holypala";
    if (normalized.equals("protectionpaladin"))
      return "protpaladin";
    if (normalized.equals("protectionwarrior"))
      return "protwarrior";
    if (normalized.equals("holypriest"))
      return "holypri";
    if (normalized.equals("beastmasteryhunter"))
      return "beastmastery";
    if (normalized.equals("restorationdruid"))
      return "restodruid";
    if (normalized.equals("restorationshaman"))
      return "restosham";
    return spec;
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

  public Long blitz(String specialization) {
    return cutoffs.get("BLITZ/" + specialization.toLowerCase());
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("region", region)
      .put("season", season)
      .put("timestamp", timestamp)
      .put("rewards",
        new JsonObject(cutoffs.entrySet()
          .stream()
          .map(x -> Map.entry(x.getKey(), x.getValue()))
          .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))))
      .put("spotCounts",
        new JsonObject(spotsCounts.entrySet()
          .stream()
          .map(x -> Map.entry(x.getKey(), x.getValue()))
          .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))))
      .put("spotWithNoAlts",
        new JsonObject(spotWithNoAlts.entrySet()
          .stream()
          .map(x -> Map.entry(x.getKey(), x.getValue()))
          .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))));
  }

  public JsonObject toJsonWithPredictions() {
    return toJson().put("predictions",
      new JsonObject(cutoffsPredictions.entrySet()
        .stream()
        .map(x -> Map.entry(x.getKey(), x.getValue()))
        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue))));
  }

  public static Cutoffs fromJson(JsonObject json) {
    return new Cutoffs(json.getString("region"), json.getString("season"),
      json.getJsonObject("rewards").stream().collect(Collectors.toMap(Map.Entry::getKey, x -> (Long) x.getValue())),
      json.getJsonObject("spotCounts").stream().collect(Collectors.toMap(Map.Entry::getKey, x -> (Long) x.getValue())),
      json.getJsonObject("spotWithNoAlts")
        .stream()
        .collect(Collectors.toMap(Map.Entry::getKey, x -> (Long) x.getValue())),
      json.getLong("timestamp"));
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
      return region.equals(other.region) && season.equals(other.season) && cutoffs.equals(other.cutoffs);
    }
    return false;
  }
}
