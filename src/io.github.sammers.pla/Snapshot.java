package io.github.sammers.pla;


import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.Date;
import java.util.List;

import static java.time.ZoneOffset.UTC;

public record Snapshot(List<Character> characters, Long timestamp, String region, String dateTime) implements Resp {

    public static Snapshot empty(String region) {
        return new Snapshot(List.of(), -1L, region, "");
    }

    public static Snapshot of(List<Character> characters, String region, Long timestamp) {
        Instant instant = Instant.ofEpochMilli(timestamp);
        ZonedDateTime zonedDateTime = instant.atZone(UTC);
        String format = Main.DATA_TIME.format(zonedDateTime);
        if (characters == null || characters.isEmpty()) {
            return new Snapshot(List.of(), timestamp, region, format);
        }
        return new Snapshot(characters, timestamp, region, format);
    }

    public Snapshot filter(final List<String> specs) {
        final List<Character> chars = characters.stream().filter(c -> {
            Boolean res = false;
            for (String spec : specs) {
                res = res || c.fullSpec().toLowerCase().replaceAll(" ", "").replaceAll("'", "")
                    .contains(spec.toLowerCase().replaceAll(" ", "").replaceAll("'", ""));
            }
            return res;
        }).sorted(Comparator.comparing(Character::rating)).toList();
        return new Snapshot(chars, timestamp, region, dateTime);
    }

    public JsonObject toJson(Long page) {
        List<JsonObject> chars = characters.stream().skip((page - 1) * 100L).limit(100).map(JsonConvertable::toJson).toList();
        JsonObject put = new JsonObject()
            .put("characters", new JsonArray(chars))
            .put("timestamp", timestamp)
            .put("date_time", dateTime)
            .put("region", region)
            .put("page", page)
            .put("total_pages", Calculator.totalPages(characters().size(), 100))
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
        return put;
    }

    public JsonObject toJson() {
        List<JsonObject> chars = characters.stream().map(JsonConvertable::toJson).toList();
        return new JsonObject()
            .put("characters", new JsonArray(chars))
            .put("timestamp", timestamp)
            .put("date_time", dateTime)
            .put("region", region)
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
    }

    public static Snapshot fromJson(JsonObject entries) {
        Long ts = entries.getLong("timestamp");
        Instant instant = Instant.ofEpochMilli(ts);
        ZonedDateTime zonedDateTime = instant.atZone(UTC);
        String format = Main.DATA_TIME.format(zonedDateTime);
        return new Snapshot(entries.getJsonArray("characters").stream().map(x -> (JsonObject) x).map(Character::fromJson).toList(), ts, entries.getString("region"), format);
    }
}
