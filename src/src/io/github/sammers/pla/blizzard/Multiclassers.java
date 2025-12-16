package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Spec;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.http.JsonPaged;
import io.github.sammers.pla.logic.Calculator;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.*;
import java.util.stream.Collectors;

public record Multiclassers(List<Multiclassers.Info> multiclassers,
  Map<String, Info> fullNameIndex) implements JsonPaged {
  /** Creates a Multiclassers instance with an automatically built index. */
  public static Multiclassers of(List<Info> multiclassers) {
    Map<String, Info> index = buildIndex(multiclassers);
    return new Multiclassers(multiclassers, index);
  }

  private static Map<String, Info> buildIndex(List<Info> multiclassers) {
    Map<String, Info> index = new HashMap<>();
    for (Info info : multiclassers) {
      // Index by main character's fullName
      if (info.main() != null) {
        index.put(info.main().fullName(), info);
      }
      // Index by all spec characters' fullNames
      if (info.specs() != null) {
        for (CharAndScore cas : info.specs().values()) {
          if (cas != null && cas.character() != null) {
            index.put(cas.character().fullName(), info);
          }
        }
      }
    }
    return index;
  }

  /** O(1) lookup of Info by character fullName. */
  public Optional<Info> infoByFullName(String fullName) {
    return Optional.ofNullable(fullNameIndex.get(fullName));
  }

  /**
   * O(A) lookup where A is the number of candidate names - returns the first
   * matching Info.
   */
  public Optional<Info> infoByAnyFullName(Set<String> candidateNames) {
    for (String name : candidateNames) {
      Info info = fullNameIndex.get(name);
      if (info != null) {
        return Optional.of(info);
      }
    }
    return Optional.empty();
  }

  public enum Role {
    ALL("all"), DPS("dps"), HEALER("healer"), MELEE("melee"), RANGED("ranged"), TANK("tank");

    public String role;

    Role(String role) {
      this.role = role;
    }
  }

  public Multiclassers forRole(Multiclassers.Role role) {
    Set<String> acceptedSpecs;
    if (role.equals(Role.ALL)) {
      acceptedSpecs = Spec.ALL_SPECS;
    } else if (role.equals(Role.DPS)) {
      acceptedSpecs = Spec.DPS_SPECS;
    } else if (role.equals(Role.HEALER)) {
      acceptedSpecs = Spec.HEAL_SPECS;
    } else if (role.equals(Role.TANK)) {
      acceptedSpecs = Spec.TANK_SPECS;
    } else if (role.equals(Role.MELEE)) {
      acceptedSpecs = Spec.MELEE_SPECS;
    } else if (role.equals(Role.RANGED)) {
      acceptedSpecs = Spec.RANGED_SPECS;
    } else {
      acceptedSpecs = Spec.ALL_SPECS;
    }
    // Build normalized set for comparison to handle format differences like "Beast
    // Mastery Hunter"
    // vs "Beastmastery Hunter"
    Set<String> normalizedAcceptedSpecs = acceptedSpecs.stream()
      .map(Cutoffs::normalizeSpecName)
      .collect(Collectors.toSet());
    // Filter entries and recalculate scores, keeping rankWithoutAlts
    List<Info> filteredList = multiclassers.stream()
      .filter(entry -> entry.specs()
        .keySet()
        .stream()
        .anyMatch(k -> normalizedAcceptedSpecs.contains(Cutoffs.normalizeSpecName(k))))
      .map(entry -> {
        Map<String, CharAndScore> filteredSpecs = entry.specs()
          .entrySet()
          .stream()
          .filter(spec -> normalizedAcceptedSpecs.contains(Cutoffs.normalizeSpecName(spec.getKey())))
          .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        Integer totalScore = filteredSpecs.values().stream().map(CharAndScore::score).reduce(0, Integer::sum);
        // Preserve rankWithoutAlts from original entry
        return new Info(-1, totalScore, entry.main(), filteredSpecs, entry.rankWithoutAlts(), 0.0, "");
      })
      .sorted((a, b) -> b.totalScore() - a.totalScore())
      .toList();
    // Recalculate ranks, percentile, and scoring tier
    long totalPlayers = filteredList.size();
    List<Info> resList = new ArrayList<>(filteredList.size());
    for (int i = 0; i < filteredList.size(); i++) {
      Info info = filteredList.get(i);
      int rank = i + 1;
      double percentile = totalPlayers > 0 ? (double) rank / totalPlayers * 100.0 : 0.0;
      String scoringTier = Calculator.calculateScoringTier(percentile);
      resList.add(
        new Info(rank, info.totalScore(), info.main(), info.specs(), info.rankWithoutAlts(), percentile, scoringTier));
    }
    return Multiclassers.of(resList);
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("multiclassers",
      new JsonArray(multiclassers.stream().map(Multiclassers.Info::toJson).toList()));
  }

  public record CharAndScore(Character character, Integer score, Integer rankWithoutAlts, Double percentile,
    String scoringTier) implements JsonConvertable {
    @Override
    public JsonObject toJson() {
      return new JsonObject().put("character", character.toJson())
        .put("score", score)
        .put("rank_without_alts", rankWithoutAlts)
        .put("percentile", percentile)
        .put("scoring_tier", scoringTier);
    }
  }

  public record Info(Integer rank, Integer totalScore, Character main, Map<String, CharAndScore> specs,
    Integer rankWithoutAlts, Double percentile, String scoringTier) implements JsonConvertable {
    @Override
    public JsonObject toJson() {
      JsonObject json = new JsonObject().put("rank", rank)
        .put("total_score", totalScore)
        .put("main", main.toJson())
        .put("specs",
          specs.entrySet()
            .stream()
            .collect(JsonObject::new, (jsonObject, entry) -> jsonObject.put(entry.getKey(), entry.getValue().toJson()),
              JsonObject::mergeIn));
      if (rankWithoutAlts != null) {
        json.put("rank_without_alts", rankWithoutAlts);
      }
      if (percentile != null) {
        json.put("percentile", percentile);
      }
      if (scoringTier != null) {
        json.put("scoring_tier", scoringTier);
      }
      return json;
    }
  }

  @Override
  public JsonObject toJson(Long page) {
    List<JsonObject> multiclassers = this.multiclassers.stream()
      .skip((page - 1) * 100L)
      .limit(100)
      .map(JsonConvertable::toJson)
      .toList();
    JsonObject put = new JsonObject().put("multiclassers", new JsonArray(multiclassers))
      .put("page", page)
      .put("total_pages", Calculator.totalPages(this.multiclassers.size(), 100));
    return put;
  }
}
