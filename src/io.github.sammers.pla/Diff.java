package io.github.sammers.pla;

import io.vertx.core.json.JsonObject;

import java.util.Date;

public record Diff(Long won, Long lost, Long ratingDiff, Long rankDiff, Long timestamp) implements JsonConvertable {
    public JsonObject toJson() {
        return new JsonObject()
                .put("won", won)
                .put("lost", lost)
                .put("rating_diff", ratingDiff)
                .put("rank_diff", rankDiff)
                .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
    }
}
