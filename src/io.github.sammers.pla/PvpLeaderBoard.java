package io.github.sammers.pla;

import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

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

    public Set<Character> toCharacters(Map<String, WowAPICharacter> characterCache) {
        return entities.stream()
            .map(entity -> (JsonObject) entity)
            .flatMap(entity -> {
                JsonObject character = entity.getJsonObject("character");
                JsonObject realmJson = character.getJsonObject("realm");
                String realm = realmJson.getString("slug").replaceAll("[^A-Za-z]", "");
                String name = character.getString("name");
                String key = (name + "-" + realm).toLowerCase();
                Long rank = entity.getLong("rank");
                Long rating = entity.getLong("rating");
                JsonObject seasonMatchStatistics = entity.getJsonObject("season_match_statistics");
                Long won = seasonMatchStatistics.getLong("won");
                Long lost = seasonMatchStatistics.getLong("lost");
                WowAPICharacter wowAPICharacter = characterCache.get(key);
                if(wowAPICharacter == null) {
                    return Stream.empty();
                } else {
                    return Stream.of(new Character(
                            rank,
                            rating,
                            false,
                            name,
                            wowAPICharacter.clazz(),
                            wowAPICharacter.activeSpec(),
                            wowAPICharacter.fraction(),
                            wowAPICharacter.gender(),
                            wowAPICharacter.race(),
                            realm,
                            won,
                            lost
                    ));
                }
            })
                .collect(Collectors.toSet());
    }

    public List<Character> enrich(List<Character> snapshot) {
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
        List<Character> characters = new ArrayList<>(snapshot.size());
        for (Character character : snapshot) {
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
        return characters;
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
