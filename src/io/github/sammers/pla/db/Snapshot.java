package io.github.sammers.pla.db;


import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.http.Resp;
import io.github.sammers.pla.logic.Calculator;
import io.github.sammers.pla.logic.CharAndDiff;
import io.github.sammers.pla.logic.SnapshotDiff;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static io.github.sammers.pla.logic.Conts.*;
import static io.github.sammers.pla.logic.Conts.SHUFFLE;
import static java.time.ZoneOffset.UTC;

public record Snapshot(List<Character> characters, Long timestamp, String region, String dateTime) implements Resp {

    public List<Character> findChar(String fullName) {
        return characters.stream().filter(c -> c.fullName().equals(fullName)).toList();
    }

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
        }).sorted(Comparator.comparing(Character::rating).reversed()).toList();
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

    public Snapshot applyCutoffs(String bracket, Cutoffs cutoffs) {
        if (cutoffs == null) {
            return this;
        }
        if (bracket.equals(THREE_V_THREE)) {
            Long cutoff = cutoffs.threeVThree();
            return new Snapshot(this.characters().stream().map(ch -> {
                if (ch.rating() >= cutoff) {
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList()), this.timestamp(), this.region(), this.dateTime());
        } else if (bracket.equals(RBG)) {
            Long cutoff = cutoffs.battlegrounds("ALLIANCE");
            return new Snapshot(this.characters().stream().map(ch -> {
                if (ch.rating() >= cutoff) {
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList()), this.timestamp(), this.region(), this.dateTime());
        } else if (bracket.equals(SHUFFLE)) {
            return new Snapshot(this.characters().stream().map(ch -> {
                String fullSpec = ch.fullSpec();
                String spec = fullSpec.toLowerCase().split(" ")[0];
                if (fullSpec.equals("Frost Mage")) {
                    spec = "frostm";
                } else if (fullSpec.equals("Frost Death Knight")) {
                    spec = "frostd";
                } else if (fullSpec.equals("Beast Mastery Hunter")) {
                    spec = "beastmastery";
                }
                Long cutoff = cutoffs.shuffle(spec);
                if(cutoff == null) {
                    return ch;
                }
                if (ch.rating() >= cutoff) {
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList()), this.timestamp(), this.region(), this.dateTime());
        }
        return this;
    }


}
