package io.github.sammers.pla;


import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;

public record Snapshot(List<Character> characters, Long timestamp) {

    public static Snapshot of(List<Character> characters) {
        if (characters == null || characters.isEmpty()) {
            return new Snapshot(List.of(), System.currentTimeMillis());
        }
        return new Snapshot(characters, System.currentTimeMillis());
    }

    public JsonObject toJson(Long page) {
        List<JsonObject> chars = characters.stream().skip((page - 1) * 100L).limit(100).map(JsonConvertable::toJson).toList();
        JsonObject put = new JsonObject()
                .put("characters", new JsonArray(chars))
                .put("timestamp", timestamp)
                .put("page", page)
                .put("total_pages", characters.size() / 100);
        return put;
    }

    public JsonObject toJson() {
        List<JsonObject> chars = characters.stream().map(JsonConvertable::toJson).toList();
        return new JsonObject()
                .put("characters", new JsonArray(chars))
                .put("timestamp", timestamp);
    }

    public static Snapshot fromJson(JsonObject entries) {
        return new Snapshot(entries.getJsonArray("characters").stream().map(x -> (JsonObject) x).map(Character::fromJson).toList(), entries.getLong("timestamp"));
    }
}
