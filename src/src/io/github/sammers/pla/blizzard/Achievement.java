package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

public record Achievement(Long id, String name, Long completedTimestamp) implements JsonConvertable {
  public static Achievement parse(JsonObject achievement) {
    return new Achievement(achievement.getLong("id"), achievement.getJsonObject("achievement").getString("name"),
      achievement.getLong("completed_timestamp"));
  }

  public static Achievement fromJson(JsonObject json) {
    return new Achievement(json.getLong("id"), json.getString("name"), json.getLong("completed_timestamp"));
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("id", id).put("name", name).put("completed_timestamp", completedTimestamp);
  }
}
