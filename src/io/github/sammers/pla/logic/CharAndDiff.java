package io.github.sammers.pla.logic;


import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

public record CharAndDiff(Character character, Diff diff) implements JsonConvertable {

    public JsonObject toJson() {
        return new JsonObject().put("character", character.toJson()).put("diff", diff.toJson());
    }

    public static CharAndDiff fromJson(JsonObject entries) {
        return new CharAndDiff(Character.fromJson(entries.getJsonObject("character")), Diff.fromJson(entries.getJsonObject("diff")));
    }
}
