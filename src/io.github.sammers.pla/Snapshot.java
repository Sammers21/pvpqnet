package io.github.sammers.pla;


import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;

public record Snapshot(List<JsonConvertable> characters, Long timestamp) {

    public static Snapshot of(List<Character> characters) {
        return new Snapshot(characters.stream().map(x -> (JsonConvertable) x).toList(), System.nanoTime() / 1000000);
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
}
