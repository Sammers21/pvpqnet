package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;
import java.util.List;
import java.util.stream.Collectors;

record Spot(String bracketType, Long spot, Long rating, Long won, Long lost) implements JsonConvertable {
  public static Spot fromJson(JsonObject json) {
    return new Spot(json.getString("bracket_type"), json.getLong("spot"), json.getLong("rating"), json.getLong("won"),
      json.getLong("lost"));
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("bracket_type", bracketType)
      .put("spot", spot)
      .put("rating", rating)
      .put("won", won)
      .put("lost", lost);
  }
}

record Season(String name, Achievement highestAchievement, String rank, List<Spot> spots) implements JsonConvertable {
  public static Season fromJson(JsonObject json) {
    return new Season(json.getString("name"), Achievement.fromJson(json.getJsonObject("highest_achievement")),
      json.getString("rank"),
      json.getJsonArray("spots").stream().map(JsonObject.class::cast).map(Spot::fromJson).collect(Collectors.toList()));
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("name", name)
      .put("highest_achievement", highestAchievement.toJson())
      .put("rank", rank)
      .put("spots", spots.stream().map(Spot::toJson).collect(Collectors.toList()));
  }
}

record Expansion(String name, List<Season> seasons) implements JsonConvertable {
  public static Expansion fromJson(JsonObject json) {
    return new Expansion(json.getString("name"),
      json.getJsonArray("seasons")
        .stream()
        .map(JsonObject.class::cast)
        .map(Season::fromJson)
        .collect(Collectors.toList()));
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("name", name)
      .put("seasons", seasons.stream().map(Season::toJson).collect(Collectors.toList()));
  }
}

public record TitlesHistory(List<Expansion> expansions) implements JsonConvertable {
  public static TitlesHistory parse(JsonObject titlesHistory) {
    if (titlesHistory == null || titlesHistory.fieldNames().size() == 0) {
      return new TitlesHistory(List.of());
    }
    return new TitlesHistory(titlesHistory.getJsonArray("expansions")
      .stream()
      .map(JsonObject.class::cast)
      .map(Expansion::fromJson)
      .collect(Collectors.toList()));
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("expansions", expansions.stream().map(Expansion::toJson).collect(Collectors.toList()));
  }
}
