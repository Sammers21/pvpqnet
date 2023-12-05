package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

public record Realm(int id, String name, String slug) implements JsonConvertable {
    public static Realm fromBlizzardJson(JsonObject json) {
        return new Realm(
            json.getInteger("id"),
            json.getString("name"),
            json.getString("slug")
        );
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("id", id)
            .put("name", name)
            .put("slug", slug);
    }

    public static Realm fromJson(JsonObject json) {
        return new Realm(
            json.getInteger("id"),
            json.getString("name"),
            json.getString("slug")
        );
    }
}
