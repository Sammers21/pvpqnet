package io.github.sammers.pla;

import io.vertx.core.json.JsonObject;

public interface JsonPaged extends JsonConvertable {
     JsonObject toJson(Long page);
}
