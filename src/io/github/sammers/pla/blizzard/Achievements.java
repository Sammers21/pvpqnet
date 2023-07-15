package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

public record Achievements() implements JsonConvertable {

    public static Achievements parse(JsonObject achievements) {
        return new Achievements();
    }

    public static Achievements fromJson(JsonObject json) {
        return new Achievements();
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject();
    }

}
