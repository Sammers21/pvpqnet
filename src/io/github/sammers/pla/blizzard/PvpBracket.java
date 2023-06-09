package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.Optional;

public record PvpBracket(String bracketType, Long rating, Long won, Long lost) implements JsonConvertable {
    public static PvpBracket parse(JsonObject entries) {
        String type = entries.getJsonObject("bracket").getString("type");
        Long rating = entries.getLong("rating");
        Optional<JsonObject> stats;
        if (type.equals("SHUFFLE")) {
            type = type + "-" + entries.getJsonObject("specialization").getString("name");
            stats = Optional.ofNullable(entries.getJsonObject("season_round_statistics"));
        } else {
            stats = Optional.ofNullable(entries.getJsonObject("season_match_statistics"));
        }
        Long won = stats.map(st -> st.getLong("won")).orElse(0L);
        Long lost = stats.map(st -> st.getLong("lost")).orElse(0L);
        return new PvpBracket(type, rating, won, lost);
    }

    public static PvpBracket fromJson(JsonObject entries) {
        return new PvpBracket(
            entries.getString("bracket_type"),
            entries.getLong("rating"),
            entries.getLong("won"),
            entries.getLong("lost")
        );
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("bracket_type", bracketType)
            .put("rating", rating)
            .put("won", won)
            .put("lost", lost);
    }
}
