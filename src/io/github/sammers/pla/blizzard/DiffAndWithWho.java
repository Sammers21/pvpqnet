package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.logic.Diff;
import io.vertx.core.json.JsonObject;

import java.util.List;

record DiffAndWithWho(Diff diff, List<String> withWho) implements JsonConvertable {

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("diff", diff.toJson())
            .put("with_who", withWho);
    }

    public static DiffAndWithWho fromJson(JsonObject entries) {
        return new DiffAndWithWho(
            Diff.fromJson(entries.getJsonObject("diff")),
            entries.getJsonArray("with_who").stream()
                .map(String.class::cast)
                .toList()
        );
    }
}