package io.github.sammers.pla.http;

import io.vertx.core.json.JsonObject;

public interface JsonConvertable {
    JsonObject toJson();
}
