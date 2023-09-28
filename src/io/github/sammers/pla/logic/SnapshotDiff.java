package io.github.sammers.pla.logic;

import io.github.sammers.pla.Main;
import io.github.sammers.pla.blizzard.Cutoffs;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.http.Resp;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

import static io.github.sammers.pla.logic.Conts.*;

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

    public SnapshotDiff applyCutoffs(String bracket, Cutoffs cutoffs) {
        if (cutoffs == null) {
            return this;
        }
        if (bracket.equals(THREE_V_THREE)) {
            Long cutoff = cutoffs.threeVThree();
            return new SnapshotDiff(this.chars().stream().map(charAndDiff -> {
                if (charAndDiff.character().rating() >= cutoff) {
                    return new CharAndDiff(charAndDiff.character().changeCutoff(true), charAndDiff.diff());
                } else {
                    return charAndDiff;
                }
            }).collect(Collectors.toList()), this.timestamp());
        } else if (bracket.equals(RBG)) {
            Long cutoff = cutoffs.battlegrounds("ALLIANCE");
            return new SnapshotDiff(this.chars().stream().map(charAndDiff -> {
                if (charAndDiff.character().rating() >= cutoff) {
                    return new CharAndDiff(charAndDiff.character().changeCutoff(true), charAndDiff.diff());
                } else {
                    return charAndDiff;
                }
            }).collect(Collectors.toList()), this.timestamp());
        } else if (bracket.equals(SHUFFLE)) {
            return new SnapshotDiff(this.chars().stream().map(charAndDiff -> {
                String fullSpec = charAndDiff.character().fullSpec();
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
                    return charAndDiff;
                }
                if (charAndDiff.character().rating() >= cutoff) {
                    return new CharAndDiff(charAndDiff.character().changeCutoff(true), charAndDiff.diff());
                } else {
                    return charAndDiff;
                }
            }).collect(Collectors.toList()), this.timestamp());
        }
        return this;
    }
}
