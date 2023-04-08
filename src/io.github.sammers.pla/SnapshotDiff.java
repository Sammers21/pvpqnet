package io.github.sammers.pla;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.Date;
import java.util.List;

public record SnapshotDiff(List<CharAndDiff> chars, Long timestamp) implements Resp {
    public static SnapshotDiff empty() {
        return new SnapshotDiff(List.of(), System.currentTimeMillis());
    }

    public SnapshotDiff filter(final List<String> specs) {
        final List<CharAndDiff> rchars = chars().stream().filter(c -> {
            Boolean res = false;
            for (String spec : specs) {
                res = res || c.character().fullSpec().toLowerCase().replaceAll(" ", "").replaceAll("'", "")
                    .contains(spec.toLowerCase().replaceAll(" ", "").replaceAll("'", ""));
            }
            return res;
        }).toList();
        return new SnapshotDiff(rchars, timestamp);
    }

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
