package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.Date;

public record Diff(Long won, Long lost, Long ratingDiff, Long rankDiff, Long timestamp) implements JsonConvertable {
    public JsonObject toJson() {
        return new JsonObject()
            .put("won", won)
            .put("lost", lost)
            .put("rating_diff", ratingDiff)
            .put("rank_diff", rankDiff)
            .put("timestamp", timestamp)
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
    }

    public static Diff fromJson(JsonObject entries) {
        return new Diff(
            entries.getLong("won"),
            entries.getLong("lost"),
            entries.getLong("rating_diff"),
            entries.getLong("rank_diff"),
            entries.getLong("timestamp")
        );
    }
}
