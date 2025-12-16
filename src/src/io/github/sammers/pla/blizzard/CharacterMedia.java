package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public record CharacterMedia(String avatar, String insert, String mainRaw) implements JsonConvertable {

  private static final Logger logger = LoggerFactory.getLogger(CharacterMedia.class);
  public static CharacterMedia parse(JsonObject characterMedia) {
    JsonArray array = characterMedia.getJsonArray("assets");
    if (array == null) {
      logger.error("No assets in character media: {}", characterMedia.encodePrettily());
      return new CharacterMedia(null, null, null);
    }
    Map<String, String> assets = array.stream()
      .map(o -> (JsonObject) o)
      .collect(Collectors.toMap(o -> o.getString("key"), o -> o.getString("value")));
    return new CharacterMedia(assets.get("avatar"), assets.get("inset"), assets.get("main-raw"));
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("avatar", avatar).put("insert", insert).put("main_raw", mainRaw);
  }

  public static CharacterMedia fromJson(JsonObject json) {
    if (json == null) {
      return new CharacterMedia(null, null, null);
    }
    return new CharacterMedia(json.getString("avatar"), json.getString("insert"), json.getString("main_raw"));
  }
}
