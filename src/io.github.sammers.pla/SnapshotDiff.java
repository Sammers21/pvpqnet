package io.github.sammers.pla;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.ocpsoft.prettytime.PrettyTime;

import java.util.Date;
import java.util.List;

public record SnapshotDiff(List<CharAndDiff> chars, Long timestamp) implements JsonPaged {
    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("characters", new JsonArray(chars.stream().map(JsonConvertable::toJson).toList()))
            .put("timestamp", timestamp)
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
    }

    @Override
    public JsonObject toJson(Long page) {
        List<JsonObject> diffs = chars().stream().skip((page - 1) * 100L).limit(100).map(JsonConvertable::toJson).toList();
        JsonObject put = new JsonObject()
            .put("characters", new JsonArray(diffs))
            .put("timestamp", timestamp)
            .put("page", page)
            .put("total_pages", Calculator.totalPages(chars().size(), 100))
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
        return put;
    }
}
