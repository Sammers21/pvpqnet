package io.github.sammers.pla;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;

public record SnapshotDiff(List<CharAndDiff> chars, Long timestamp) implements JsonPaged {
    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("characters", new JsonArray(chars.stream().map(JsonConvertable::toJson).toList()))
            .put("timestamp", timestamp);
    }

    @Override
    public JsonObject toJson(Long page) {
        List<JsonObject> chars = chars().stream().skip((page - 1) * 100L).limit(100).map(JsonConvertable::toJson).toList();
        JsonObject put = new JsonObject()
            .put("characters", new JsonArray(chars))
            .put("timestamp", timestamp)
            .put("page", page)
            .put("total_pages", chars.size() / 100);
        return put;
    }
}
