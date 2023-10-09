package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Snapshot;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.logic.Diff;
import io.vertx.core.json.JsonObject;

import java.util.List;
import java.util.Optional;

public record PvpBracket(String bracketType,
                         Long rating,
                         Long won,
                         Long lost,
                         Long rank,
                         Long seasonMaxRating,
                         Long seasonMaxRatingAchievedTimestamp,
                         Long maxRating,
                         Long maxRatingAchievedTimestamp,
                         Boolean isRankOneRange,
                         GamingHistory gamingHistory
) implements JsonConvertable {
    public static PvpBracket parse(JsonObject wowApiBracket, Optional<PvpBracket> prevBracket, Long rank, Long bracketRankOneCutoff) {
        String type = wowApiBracket.getJsonObject("bracket").getString("type");
        Long rating = wowApiBracket.getLong("rating");
        Optional<JsonObject> stats;
        if (type.equals("SHUFFLE")) {
            type = type + "-" + wowApiBracket.getJsonObject("specialization").getString("name");
            stats = Optional.ofNullable(wowApiBracket.getJsonObject("season_round_statistics"));
        } else {
            stats = Optional.ofNullable(wowApiBracket.getJsonObject("season_match_statistics"));
        }
        Long won = stats.map(st -> st.getLong("won")).orElse(0L);
        Long lost = stats.map(st -> st.getLong("lost")).orElse(0L);
        Long seasonMaxRating = Math.max(rating, prevBracket.map(PvpBracket::seasonMaxRating).orElse(-1L));
        Long seasonMaxRatingAchievedTimestamp;
        if (seasonMaxRating.equals(rating)) {
            seasonMaxRatingAchievedTimestamp = System.currentTimeMillis();
        } else {
            seasonMaxRatingAchievedTimestamp = prevBracket.map(PvpBracket::seasonMaxRatingAchievedTimestamp).orElse(-1L);
        }
        Long maxRating = Math.max(rating, prevBracket.map(PvpBracket::maxRating).orElse(-1L));
        Long maxRatingAchievedTimestamp;
        if (maxRating.equals(rating)) {
            maxRatingAchievedTimestamp = System.currentTimeMillis();
        } else {
            maxRatingAchievedTimestamp = prevBracket.map(PvpBracket::maxRatingAchievedTimestamp).orElse(-1L);
        }
        Boolean isRankOneRange = rating >= bracketRankOneCutoff;
        GamingHistory gamingHistory = prevBracket.map(PvpBracket::gamingHistory).orElse(new GamingHistory(List.of()));
        return new PvpBracket(type, rating, won, lost, rank, seasonMaxRating, seasonMaxRatingAchievedTimestamp, maxRating, maxRatingAchievedTimestamp, isRankOneRange, gamingHistory);
    }

    public static PvpBracket fromJson(JsonObject entries) {
        return new PvpBracket(
            entries.getString("bracket_type"),
            entries.getLong("rating"),
            entries.getLong("won"),
            entries.getLong("lost"),
            entries.getLong("rank"),
            Optional.ofNullable(entries.getLong("season_max_rating")).orElse(-1L),
            Optional.ofNullable(entries.getLong("season_max_rating_achieved_timestamp")).orElse(-1L),
            Optional.ofNullable(entries.getLong("max_rating")).orElse(-1L),
            Optional.ofNullable(entries.getLong("max_rating_achieved_timestamp")).orElse(-1L),
            Optional.ofNullable(entries.getBoolean("is_rank_one_range")).orElse(false),
            Optional.ofNullable(entries.getJsonObject("gaming_history")).map(GamingHistory::fromJson).orElse(new GamingHistory(List.of()))
        );
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
            .put("bracket_type", bracketType)
            .put("rating", rating)
            .put("won", won)
            .put("lost", lost)
            .put("rank", rank)
            .put("is_rank_one_range", isRankOneRange)
            .put("season_max_rating", seasonMaxRating)
            .put("season_max_rating_achieved_timestamp", seasonMaxRatingAchievedTimestamp)
            .put("max_rating", maxRating)
            .put("max_rating_achieved_timestamp", maxRatingAchievedTimestamp);
    }
}
