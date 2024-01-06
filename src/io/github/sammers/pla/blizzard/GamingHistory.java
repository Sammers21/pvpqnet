package io.github.sammers.pla.blizzard;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

record GamingHistory(List<DiffAndWithWho> hist) implements JsonConvertable {

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("history", hist.stream().map(JsonConvertable::toJson).toList());
    }

    public GamingHistory addDiff(DiffAndWithWho diff) {
        if (hist instanceof ArrayList) {
            hist.add(diff);
            return this;
        } else {
            List<DiffAndWithWho> newHist = new ArrayList<>(hist);
            newHist.add(diff);
            if(newHist.size() > 10_000){
                newHist.remove(0);
            }
            return new GamingHistory(newHist);
        }
    }

    public static GamingHistory fromJson(JsonObject entries) {
        return new GamingHistory(
            new ArrayList<>(entries.getJsonArray("history").stream()
                .map(JsonObject.class::cast)
                .map(DiffAndWithWho::fromJson)
                .collect(Collectors.toList())
            )
        );
    }
}
