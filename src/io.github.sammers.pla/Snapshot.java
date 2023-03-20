package io.github.sammers.pla;


import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.Date;
import java.util.List;

public record Snapshot(List<Character> characters, Long timestamp, String region) implements JsonPaged {

    public static Snapshot empty(String region) {
        return new Snapshot(List.of(), -1L, region);
    }

    public static Snapshot of(List<Character> characters, String region, Long timestamp) {
        if (characters == null || characters.isEmpty()) {
            return new Snapshot(List.of(), timestamp, region);
        }
        return new Snapshot(characters, timestamp, region);
    }

    public JsonObject toJson(Long page) {
        List<JsonObject> chars = characters.stream().skip((page - 1) * 100L).limit(100).map(JsonConvertable::toJson).toList();
        JsonObject put = new JsonObject()
            .put("characters", new JsonArray(chars))
            .put("timestamp", timestamp)
            .put("region", region)
            .put("page", page)
            .put("total_pages", Calculator.totalPages(characters().size(), 100))
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
        return put;
    }

    public JsonObject toJson() {
        List<JsonObject> chars = characters.stream().map(JsonConvertable::toJson).toList();
        return new JsonObject()
            .put("characters", new JsonArray(chars))
            .put("timestamp", timestamp)
            .put("region", region)
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
    }

    public static Snapshot fromJson(JsonObject entries) {
        return new Snapshot(entries.getJsonArray("characters").stream().map(x -> (JsonObject) x).map(Character::fromJson).toList(), entries.getLong("timestamp"), entries.getString("region"));
    }
}
