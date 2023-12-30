package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;
import java.util.Map;


public record Multiclassers(List<Multiclassers.Info> multiclassers) implements JsonConvertable {

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("multiclassers", new JsonArray(multiclassers.stream()
                .map(Multiclassers.Info::toJson)
                .toList()));
    }

    public record CharAndScore(Character character, Integer score) implements JsonConvertable {
        @Override
        public JsonObject toJson() {
            return new JsonObject()
                .put("character", character.toJson())
                .put("score", score);
        }

    }

    public record Info(Integer totalScore, Character main, Map<String, CharAndScore> specs) implements JsonConvertable {
        @Override
        public JsonObject toJson() {
            return new JsonObject()
                .put("total_score", totalScore)
                .put("main", main.toJson())
                .put("specs", specs.entrySet().stream()
                    .collect(JsonObject::new, (jsonObject, entry) -> jsonObject.put(entry.getKey(), entry.getValue().toJson()), JsonObject::mergeIn));
        }

    }
}

