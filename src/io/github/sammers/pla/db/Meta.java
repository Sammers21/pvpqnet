package io.github.sammers.pla.db;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public record Meta(Map<String, TierList> tierLists, List<Spec> specs) implements JsonConvertable {
    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("tier_lists", tierLists)
            .put("specs", specs.stream().map(Spec::toJson).toList());
    }
}
