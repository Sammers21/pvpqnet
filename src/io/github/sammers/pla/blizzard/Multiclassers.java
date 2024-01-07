package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Spec;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.http.JsonPaged;
import io.github.sammers.pla.logic.Calculator;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public record Multiclassers(List<Multiclassers.Info> multiclassers) implements JsonConvertable, JsonPaged {

  public enum Role {
    ALL("all"),
    DPS("dps"),
    HEALER("healer"),
    MELEE("melee"),
    RANGED("ranged"),
    TANK("tank");

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
    List<Info> list = multiclassers.stream()
        .filter(entry -> entry.specs().keySet().stream().anyMatch(acceptedSpecs::contains))
        .map(entry -> {
          return new Multiclassers.Info(-1, entry.totalScore(), entry.main(),
              entry.specs().entrySet().stream()
                  .filter(spec -> acceptedSpecs.contains(spec.getKey()))
                  .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));
        })
        .map(entry -> {
          Integer totalScore = entry.specs().values().stream().map(CharAndScore::score).reduce(0,
              Integer::sum);
          return new Multiclassers.Info(-1, totalScore, entry.main(), entry.specs());
        })
        .sorted((a, b) -> b.totalScore() - a.totalScore())
        .toList();
    List<Info> resList = new ArrayList<>(list.size());
    for (int i = 0; i < list.size(); i++) {
      Info info = list.get(i);
      resList.add(new Info(i + 1, info.totalScore(), info.main(), info.specs()));
    }
    return new Multiclassers(resList);
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject()
        .put("multiclassers", new JsonArray(multiclassers.stream()
            .map(Multiclassers.Info::toJson)
            .toList()));
  }

  public record CharAndScore(Character character, Integer score) implements JsonConvertable {
    @Override
    public JsonObject toJson() {
      return new JsonObject()
          .put("character", character.toJson())
          .put("score", score);
    }

  }

  public record Info(Integer rank, Integer totalScore, Character main, Map<String, CharAndScore> specs)
      implements JsonConvertable {
    @Override
    public JsonObject toJson() {
      return new JsonObject()
          .put("rank", rank)
          .put("total_score", totalScore)
          .put("main", main.toJson())
          .put("specs", specs.entrySet().stream()
              .collect(JsonObject::new,
                  (jsonObject, entry) -> jsonObject.put(entry.getKey(), entry.getValue().toJson()),
                  JsonObject::mergeIn));
    }

  }

  @Override
  public JsonObject toJson(Long page) {
    List<JsonObject> multiclassers = this.multiclassers.stream().skip((page - 1) * 100L).limit(100)
        .map(JsonConvertable::toJson).toList();
    JsonObject put = new JsonObject()
        .put("multiclassers", new JsonArray(multiclassers))
        .put("page", page)
        .put("total_pages", Calculator.totalPages(this.multiclassers.size(), 100));
    return put;
  }
}
