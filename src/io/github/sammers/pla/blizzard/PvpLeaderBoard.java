package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.logic.CharacterCache;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static io.github.sammers.pla.logic.Conts.SHUFFLE_SPEC_TO_SPEC;

public record PvpLeaderBoard(
    JsonObject links,
    JsonObject season,
    String name,
    JsonObject bracket,
    JsonArray entities) implements JsonConvertable {

    public List<CharOnLeaderBoard> charOnLeaderBoards() {
        return entities().stream()
            .map(entity -> (JsonObject) entity)
            .map(entity -> {
                JsonObject character = entity.getJsonObject("character");
                JsonObject realmJson = character.getJsonObject("realm");
                String slug = realmJson.getString("slug").replaceAll("[^A-Za-z]", "");
                String realm = slug.substring(0, 1).toUpperCase() + slug.substring(1);
                String name = character.getString("name");
                Long rank = entity.getLong("rank");
                Long rating = entity.getLong("rating");
                JsonObject seasonMatchStatistics = entity.getJsonObject("season_match_statistics");
                Long won = seasonMatchStatistics.getLong("won");
                Long lost = seasonMatchStatistics.getLong("lost");
                return new CharOnLeaderBoard(
                    name,
                    realm,
                    rank,
                    rating,
                    won,
                    lost
                );
            }).toList();
    }

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

    public Set<Character> toCharacters(CharacterCache characterCache, String bracketId) {
        return entities.stream()
            .map(entity -> (JsonObject) entity)
            .flatMap(entity -> {
                JsonObject character = entity.getJsonObject("character");
                JsonObject realmJson = character.getJsonObject("realm");
                String slug = realmJson.getString("slug").replaceAll("[^A-Za-z]", "");
                String realm = slug.substring(0, 1).toUpperCase() + slug.substring(1);
                String name = character.getString("name");
                Long rank = entity.getLong("rank");
                Long rating = entity.getLong("rating");
                JsonObject seasonMatchStatistics = entity.getJsonObject("season_match_statistics");
                Long won = seasonMatchStatistics.getLong("won");
                Long lost = seasonMatchStatistics.getLong("lost");
                WowAPICharacter wowAPICharacter = characterCache.getByFullName(Character.fullNameByRealmAndName(name, slug));
                if(wowAPICharacter == null) {
                    return Stream.empty();
                } else {
                    String fullSpec = wowAPICharacter.activeSpec() + " " + wowAPICharacter.clazz();
                    if(bracket.getString("type").equals("SHUFFLE")) {
                        fullSpec = SHUFFLE_SPEC_TO_SPEC.get(bracketId);
                    }
                    return Stream.of(new Character(
                        rank,
                        rating,
                        false,
                        name,
                        wowAPICharacter.clazz(),
                        fullSpec,
                        wowAPICharacter.fraction(),
                        wowAPICharacter.gender(),
                        wowAPICharacter.race(),
                        realm,
                        won,
                        lost,
                        Optional.of(wowAPICharacter.petHash())
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
