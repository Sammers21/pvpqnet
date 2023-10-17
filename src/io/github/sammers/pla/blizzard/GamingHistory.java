package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.logic.Diff;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

record GamingHistory(List<DiffAndWithWho> hist) implements JsonConvertable {

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("history", hist.stream().map(JsonConvertable::toJson).toList());
    }

    public GamingHistory addDiff(Diff diff, List<String> withWho) {
        if (hist instanceof ArrayList) {
            hist.add(new DiffAndWithWho(diff, withWho));
            return this;
        } else {
            List<DiffAndWithWho> newHist = new ArrayList<>(hist);
            newHist.add(new DiffAndWithWho(diff, withWho));
            if(newHist.size() > 500){
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