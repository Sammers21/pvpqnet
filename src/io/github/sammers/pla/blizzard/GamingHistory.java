package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.List;

record GamingHistory(List<DiffAndWithWho> hist) implements JsonConvertable {

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("history", hist.stream().map(JsonConvertable::toJson).toList());
    }

    public static GamingHistory fromJson(JsonObject entries) {
        return new GamingHistory(
            entries.getJsonArray("history").stream()
                .map(JsonObject.class::cast)
                .map(DiffAndWithWho::fromJson)
                .toList()
        );
    }
}