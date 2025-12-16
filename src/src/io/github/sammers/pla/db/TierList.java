package io.github.sammers.pla.db;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;
import java.util.List;
import java.util.Map;

public record TierList(Map<String, List<String>> tiers) implements JsonConvertable {
  @Override
  public JsonObject toJson() {
    return new JsonObject().put("tiers", tiers);
  }
}
