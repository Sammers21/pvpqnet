package io.github.sammers.pla;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public record PvpLeaderBoard(
    JsonObject links,
    JsonObject season,
    String name,
    JsonObject bracket,
    JsonArray entities) implements JsonConvertable {

    public JsonObject toJson() {
        return new JsonObject()
            .put("_links", links)
            .put("season", season)
            .put("name", name)
            .put("bracket", bracket)
            .put("entries", entities);
    }

    public PvpLeaderBoard combine(PvpLeaderBoard other) {
        JsonArray newEntities = new JsonArray();
        newEntities.addAll(entities);
        newEntities.addAll(other.entities);
        return new PvpLeaderBoard(links, season, name, bracket, newEntities);
    }

    public Snapshot enrich(Snapshot snapshot) {
        HashMap<String, JsonObject> nameToData = new HashMap<>();
        for (Object entity : entities) {
            JsonObject entityJson = (JsonObject) entity;
            JsonObject character = entityJson.getJsonObject("character");
            JsonObject realmJson = character.getJsonObject("realm");
            String realm = realmJson.getString("slug").replaceAll("[^A-Za-z]", "");
            String name = character.getString("name");
            String key = (name + "-" + realm).toLowerCase();
            nameToData.put(key, entityJson);
        }
        List<Character> characters = new ArrayList<>(snapshot.characters().size());
        for (Character character : snapshot.characters()) {
            String key = (character.name() + "-" + character.realm().replaceAll("[^A-Za-z]", "")).toLowerCase();
            JsonObject entity = nameToData.get(key);
            if(entity == null) {
                characters.add(character);
            } else {
                JsonObject statistics = entity.getJsonObject("season_match_statistics");
                characters.add(Character.withWinsAndLossesAndPosAndRating(character,
                        statistics.getLong("won"),
                        statistics.getLong("lost"),
                        entity.getLong("rank"),
                        entity.getLong("rating")
                    )
                );
            }
        }
        return new Snapshot(characters, snapshot.timestamp(), snapshot.region(), snapshot.dateTime());
    }

    public static PvpLeaderBoard fromJson(JsonObject json) {
        return new PvpLeaderBoard(
            json.getJsonObject("_links"),
            json.getJsonObject("season"),
            json.getString("name"),
            json.getJsonObject("bracket"),
            json.getJsonArray("entries")
        );
    }
}
