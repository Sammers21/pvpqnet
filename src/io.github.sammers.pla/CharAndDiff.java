package io.github.sammers.pla;


import io.vertx.core.json.JsonObject;

public record CharAndDiff(Character character, Diff diff) implements JsonConvertable {

    public JsonObject toJson() {
        return character.toJson().mergeIn(diff.toJson());
    }
}
