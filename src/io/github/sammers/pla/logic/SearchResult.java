package io.github.sammers.pla.logic;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

public record SearchResult(String nick, String region, String clazz) implements JsonConvertable {

    @Override
    public JsonObject toJson() {
        return new JsonObject().put("nick", nick).put("region", region).put("class", clazz);
    }
}
