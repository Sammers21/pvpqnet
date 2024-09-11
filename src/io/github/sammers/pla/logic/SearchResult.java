package io.github.sammers.pla.logic;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.Objects;

public record SearchResult(String nick, String region, String clazz) implements JsonConvertable {

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SearchResult that = (SearchResult) o;
        return Objects.equals(nick, that.nick);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(nick);
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject().put("nick", nick).put("region", region).put("class", clazz);
    }
}
