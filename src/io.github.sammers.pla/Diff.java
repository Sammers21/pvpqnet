package io.github.sammers.pla;

import io.vertx.core.json.JsonObject;

public record Diff(Long won, Long lost, Long ratingDiff, Long rankDiff) implements JsonConvertable {
    public JsonObject toJson() {
        return new JsonObject()
                .put("won", won)
                .put("lost", lost)
                .put("rating_diff", ratingDiff)
                .put("rank_diff", rankDiff);
    }
}
