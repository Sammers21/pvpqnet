package io.github.sammers.pla.blizzard;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;
import io.github.sammers.pla.logic.Diff;

record GamingHistory(List<DiffAndWithWho> hist) implements JsonConvertable {

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("history", hist.stream().map(JsonConvertable::toJson).toList());
    }

    public GamingHistory addDiff(DiffAndWithWho diff) {
        List<DiffAndWithWho> res;
        if (hist instanceof ArrayList) {
            hist.add(diff);
            res = hist;
        } else {
            List<DiffAndWithWho> newHist = new ArrayList<>(hist);
            newHist.add(diff);
            if (newHist.size() > 10_000) {
                newHist.remove(0);
            }
            res = newHist;
        }
        return new GamingHistory(res).clean();
    }

    public GamingHistory clean() {
        return new GamingHistory(hist.stream()
            .filter(diff -> {
                Diff d = diff.diff();
                return !(d.won() < 0 || d.lost() < 0);
            }).filter(diff -> {
                Diff d = diff.diff();
                return d.won() + d.lost() < 60;
            })
            .collect(Collectors.toList()));
    }

    public static GamingHistory fromJson(JsonObject entries) {
        return new GamingHistory(
            new ArrayList<>(entries.getJsonArray("history").stream()
                .map(JsonObject.class::cast)
                .map(DiffAndWithWho::fromJson)
                .collect(Collectors.toList())
            )
        ).clean();
    }
}
