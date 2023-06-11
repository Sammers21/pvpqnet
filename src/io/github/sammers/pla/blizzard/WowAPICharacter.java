package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * WoW API character.
 * Example of JSON:
 * {
 * "_links": {
 * "self": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask?namespace=profile-eu"
 * }
 * },
 * "id": 209902508,
 * "name": "Whitemask",
 * "gender": {
 * "type": "FEMALE",
 * "name": "Female"
 * },
 * "faction": {
 * "type": "HORDE",
 * "name": "Horde"
 * },
 * "race": {
 * "key": {
 * "href": "https://eu.api.blizzard.com/data/wow/playable-race/5?namespace=static-10.0.7_48520-eu"
 * },
 * "name": "Undead",
 * "id": 5
 * },
 * "character_class": {
 * "key": {
 * "href": "https://eu.api.blizzard.com/data/wow/playable-class/5?namespace=static-10.0.7_48520-eu"
 * },
 * "name": "Priest",
 * "id": 5
 * },
 * "active_spec": {
 * "key": {
 * "href": "https://eu.api.blizzard.com/data/wow/playable-specialization/257?namespace=static-10.0.7_48520-eu"
 * },
 * "name": "Holy",
 * "id": 257
 * },
 * "realm": {
 * "key": {
 * "href": "https://eu.api.blizzard.com/data/wow/realm/1305?namespace=dynamic-eu"
 * },
 * "name": "Kazzak",
 * "id": 1305,
 * "slug": "kazzak"
 * },
 * "level": 70,
 * "experience": 0,
 * "achievement_points": 1935,
 * "achievements": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/achievements?namespace=profile-eu"
 * },
 * "titles": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/titles?namespace=profile-eu"
 * },
 * "pvp_summary": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/pvp-summary?namespace=profile-eu"
 * },
 * "encounters": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/encounters?namespace=profile-eu"
 * },
 * "media": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/character-media?namespace=profile-eu"
 * },
 * "last_login_timestamp": 1679688656000,
 * "average_item_level": 401,
 * "equipped_item_level": 401,
 * "specializations": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/specializations?namespace=profile-eu"
 * },
 * "statistics": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/statistics?namespace=profile-eu"
 * },
 * "mythic_keystone_profile": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/mythic-keystone-profile?namespace=profile-eu"
 * },
 * "equipment": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/equipment?namespace=profile-eu"
 * },
 * "appearance": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/appearance?namespace=profile-eu"
 * },
 * "collections": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/collections?namespace=profile-eu"
 * },
 * "reputations": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/reputations?namespace=profile-eu"
 * },
 * "quests": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/quests?namespace=profile-eu"
 * },
 * "achievements_statistics": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/achievements/statistics?namespace=profile-eu"
 * },
 * "professions": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/professions?namespace=profile-eu"
 * },
 * "covenant_progress": {
 * "chosen_covenant": {
 * "key": {
 * "href": "https://eu.api.blizzard.com/data/wow/covenant/1?namespace=static-10.0.7_48520-eu"
 * },
 * "name": "Kyrian",
 * "id": 1
 * },
 * "renown_level": 80,
 * "soulbinds": {
 * "href": "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/soulbinds?namespace=profile-eu"
 * }
 * }
 * }
 */
public record WowAPICharacter(long id, String name, String realm, String gender, String fraction, String race,
                              String activeSpec, int level, String clazz, int itemLevel, String region,
                              List<PvpBracket> brackets, Long lastUpdatedUTCms, Set<String> pvpTitles,
                              CharacterMedia media, String talents) implements JsonConvertable {

    public static WowAPICharacter parse(
            JsonObject entries,
            JsonObject pvpSummary,
            List<JsonObject> brackets,
            JsonObject achievements,
            JsonObject characterMedia,
            JsonObject specs,
            String region) {
        String activeSpec = entries.getJsonObject("active_spec").getString("name");
        String talents = specs.getJsonArray("specializations").stream()
            .map(s -> (JsonObject)s)
            .filter(s -> s.getJsonObject("specialization").getString("name").equals(activeSpec))
            .map(s -> s.getJsonArray("loadouts").getJsonObject(0).getString("talent_loadout_code"))
            .findFirst()
            .orElse("");
        List<PvpBracket> list = brackets.stream().map(PvpBracket::parse).toList();
        CharacterMedia media = CharacterMedia.parse(characterMedia);
        Set<String> pvpTitles = achievements.getJsonArray("achievements").stream()
            .map(s -> ((JsonObject)s).getJsonObject("achievement").getString("name"))
            .filter(s -> {
                boolean r1Glad = s.matches("(\\w+)\\h(Gladiator|Legend)(.*)");
                return s.startsWith("Gladiator")
                    || s.startsWith("Duelist")
                    || s.startsWith("Rival")
                    || s.startsWith("Challenger")
                    || s.startsWith("Combatant")
                    || s.startsWith("Legend")
                    || r1Glad;
            })
            .collect(Collectors.toSet());
        Long lastUpdatedUTCms = Instant.now().toEpochMilli();
        return new WowAPICharacter(
                entries.getInteger("id"),
                entries.getString("name"),
                entries.getJsonObject("realm").getString("name"),
                entries.getJsonObject("gender").getString("name"),
                entries.getJsonObject("faction").getString("name"),
                entries.getJsonObject("race").getString("name"),
                activeSpec,
                entries.getInteger("level"),
                entries.getJsonObject("character_class").getString("name"),
                entries.getInteger("equipped_item_level"),
                region,
                list,
                lastUpdatedUTCms,
                pvpTitles,
                media,
            talents
        );
    }

    public String fullName() {
        return (name() + "-" + realm().replaceAll(" ", "-")
                .replaceAll("'", "")).toLowerCase();
    }

    public static WowAPICharacter fromJson(JsonObject entries) {
        List<PvpBracket> brcktsFromJson;
        JsonArray array = entries.getJsonArray("brackets");
        if (array == null) {
            brcktsFromJson = List.of();
        } else {
            brcktsFromJson = array.stream().map(o -> PvpBracket.fromJson((JsonObject) o)).toList();
        }
        if (entries.getLong("lastUpdatedUTCms") == null) {
            entries.put("lastUpdatedUTCms", 0L);
        }
        return new WowAPICharacter(
            entries.getInteger("id"),
            entries.getString("name"),
            entries.getString("realm"),
            entries.getString("gender"),
            entries.getString("fraction"),
            entries.getString("race"),
            entries.getString("activeSpec"),
            entries.getInteger("level"),
            entries.getString("class"),
            entries.getInteger("itemLevel"),
            entries.getString("region"),
            brcktsFromJson,
            entries.getLong("lastUpdatedUTCms"),
            Optional.ofNullable(entries.getJsonArray("pvpTitles")).map(x -> x.stream().map(o -> (String) o).collect(Collectors.toSet())).orElse(Set.of()),
            CharacterMedia.fromJson(entries.getJsonObject("media")),
            Optional.ofNullable(entries.getString("talents")).orElse("")
        );
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
                .put("id", id)
                .put("name", name)
                .put("realm", realm)
                .put("gender", gender)
                .put("fraction", fraction)
                .put("race", race)
                .put("activeSpec", activeSpec)
                .put("level", level)
                .put("class", clazz)
                .put("itemLevel", itemLevel)
                .put("region", region)
                .put("lastUpdatedUTCms", lastUpdatedUTCms)
                .put("brackets", new JsonArray(brackets.stream().map(PvpBracket::toJson).toList()))
                .put("pvpTitles", new JsonArray(pvpTitles.stream().toList()))
                .put("media", media.toJson())
                .put("talents", talents);
    }

}