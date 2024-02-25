package io.github.sammers.pla.db;


import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.blizzard.Realms;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.http.Resp;
import io.github.sammers.pla.logic.Calculator;
import io.github.sammers.pla.logic.CharAndDiff;
import io.github.sammers.pla.logic.SnapshotDiff;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import static io.github.sammers.pla.logic.Conts.*;
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
            boolean res = false;
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
        return new JsonObject()
            .put("characters", new JsonArray(chars))
            .put("timestamp", timestamp)
            .put("date_time", dateTime)
            .put("region", region)
            .put("page", page)
            .put("total_pages", Calculator.totalPages(this.characters().size(), 100))
            .put("last_seen", Main.PRETTY_TIME.format(new Date(timestamp)));
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
            AtomicLong charsWithCutoff = new AtomicLong(0);
            List<Character> chars = this.characters().stream().map(ch -> {
                if (ch.rating() >= cutoff) {
                    charsWithCutoff.incrementAndGet();
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList());
            cutoffs.setSpotCount("ARENA_3v3", charsWithCutoff.intValue());
            return new Snapshot(chars, this.timestamp(), this.region(), this.dateTime());
        } else if (bracket.equals(RBG)) {
            Long cutoff = cutoffs.battlegrounds("ALLIANCE");
            AtomicLong charsWithCutoff = new AtomicLong(0);
            List<Character> chars = this.characters().stream().map(ch -> {
                if (ch.rating() >= cutoff) {
                    charsWithCutoff.incrementAndGet();
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList());
            cutoffs.setSpotCount("BATTLEGROUNDS/alliance", charsWithCutoff.intValue());
            cutoffs.setSpotCount("BATTLEGROUNDS/horde", charsWithCutoff.intValue());
            return new Snapshot(chars, this.timestamp(), this.region(), this.dateTime());
        } else if (bracket.equals(SHUFFLE)) {
            Map<String, Long> specCodeAndSpotCount = new HashMap<>();
            List<Character> chars = this.characters().stream().map(ch -> {
                String fullSpec = ch.fullSpec();
                String specCode = Cutoffs.specCodeByFullName(fullSpec);
                Long cutoff = cutoffs.shuffle(specCode);
                if (cutoff == null) {
                    return ch;
                }
                if (ch.rating() >= cutoff) {
                    specCodeAndSpotCount.compute(specCode, (k, v) -> v == null ? 1 : v + 1);
                    return ch.changeCutoff(true);
                } else {
                    return ch;
                }
            }).collect(Collectors.toList());
            specCodeAndSpotCount.entrySet()
                .forEach(cutoff -> cutoffs.setSpotCount("SHUFFLE/" + cutoff.getKey(), cutoff.getValue().intValue()));
            return new Snapshot(chars, this.timestamp(), this.region(), this.dateTime());
        }
        return this;
    }

    public Snapshot applySlugToName(Realms realms) {
        return new Snapshot(characters().stream().map(ch -> {
            String realmSlug = ch.realm();
            String realmName = realms.slugToName(realmSlug);
            return ch.changeRealmName(realmName);
        }).toList(), timestamp(), region(), dateTime());
    }

}
