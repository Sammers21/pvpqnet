package io.github.sammers.pla.db;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;
import java.util.List;
import java.util.Map;

public record Meta(Map<String, TierList> tierLists, Map<String, Long> specsSizing,
  List<Spec> specs) implements JsonConvertable {
  @Override
  public JsonObject toJson() {
    JsonObject sizing = new JsonObject();
    for (var entry : specsSizing.entrySet()) {
      sizing.put(entry.getKey(), entry.getValue());
    }
    return new JsonObject().put("tier_lists", tierLists)
      .put("specs_sizing", sizing)
      .put("specs", specs.stream().map(Spec::toJson).toList());
  }
}
