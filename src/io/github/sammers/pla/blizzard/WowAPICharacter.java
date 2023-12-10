package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Snapshot;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.logic.Calculator;
import io.github.sammers.pla.logic.CharAndDiff;
import io.github.sammers.pla.logic.Refs;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.slf4j.Logger;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
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
public record WowAPICharacter(long id,
                              boolean hidden,
                              String name,
                              String realm,
                              String gender,
                              String fraction,
                              String race,
                              String activeSpec,
                              int level,
                              String clazz,
                              int itemLevel,
                              String region,
                              List<PvpBracket> brackets,
                              Long lastUpdatedUTCms,
                              Achievements achievements,
                              int petHash,
                              CharacterMedia media,
                              String talents) implements JsonConvertable {

    private static final Logger log = org.slf4j.LoggerFactory.getLogger(WowAPICharacter.class);

    private static MessageDigest md;

    static {
        try {
            md = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException(e);
        }
    }

    public static WowAPICharacter parse(
            Optional<WowAPICharacter> previous,
            Refs refs,
            Optional<Cutoffs> cutoffs,
            JsonObject entries,
            JsonObject pvpSummary,
            List<JsonObject> brackets,
            JsonObject achievements,
            JsonObject characterMedia,
            JsonObject specs,
            JsonObject pets,
            String region) {
        String activeSpec = Optional.of(entries.getJsonObject("active_spec")).map(obj -> obj.getString("name")).orElse("");
        String talents = specs.getJsonArray("specializations").stream()
            .map(s -> (JsonObject) s)
            .filter(s -> s.getJsonObject("specialization").getString("name").equals(activeSpec))
            .map(s -> s.getJsonArray("loadouts").getJsonObject(0).getString("talent_loadout_code"))
            .findFirst()
            .orElse("");
        Map<String, PvpBracket> prevBrackets = previous.map(wowAPICharacter -> wowAPICharacter.brackets.stream().collect(Collectors.toMap(PvpBracket::bracketType, Function.identity()))).orElse(Map.of());
        String name = entries.getString("name").substring(0, 1).toUpperCase() + entries.getString("name").substring(1);
        String realm = Calculator.realmCalc(entries.getJsonObject("realm").getString("name"));
        List<PvpBracket> list = brackets.stream().map((JsonObject wowApiBracket) -> {
            String btype = wowApiBracket.getJsonObject("bracket").getString("type");
            Snapshot latest = refs.snapshotByBracketType(btype, BlizzardAPI.oldRegion(region));
            Long rank = Optional.ofNullable(latest).map(s -> s.findChar(Character.fullNameByRealmAndName(name, realm))).map(foundChars -> {
                if (foundChars.isEmpty()) {
                    return -1L;
                } else if (foundChars.size() == 1) {
                    return foundChars.get(0).pos();
                } else {
                    Long finalPos = -1L;
                    if (btype.equals("SHUFFLE")) {
                        String spec = wowApiBracket.getJsonObject("specialization").getString("name");
                        finalPos = foundChars.stream().filter(c -> c.fullSpec().contains(spec)).findFirst().map(Character::pos).orElse(-1L);
                    }
                    return finalPos;
                }
            }).orElse(-1L);
            Long cutoffByBracketType;
            Optional<PvpBracket> prevBracket;
            if (btype.equals("SHUFFLE")) {
                String spec = wowApiBracket.getJsonObject("specialization").getString("name");
                Long id = wowApiBracket.getJsonObject("specialization").getLong("id");
                String specCode = Cutoffs.specCodeNameById(spec, id);
                cutoffByBracketType = cutoffs.map(c -> c.shuffle(specCode)).orElse(Long.MAX_VALUE);
                prevBracket = Optional.ofNullable(prevBrackets.get(btype + "-" + spec));
            } else {
                cutoffByBracketType = cutoffs.map(c -> c.cutoffByBracketType(btype)).orElse(Long.MAX_VALUE);
                prevBracket = Optional.ofNullable(prevBrackets.get(btype));
            }
            return PvpBracket.parse(wowApiBracket, prevBracket, rank, Optional.of(cutoffByBracketType).orElse(-1L));
        }).toList();
        CharacterMedia media = CharacterMedia.parse(characterMedia);
        Long lastUpdatedUTCms = Instant.now().toEpochMilli();
        Achievements parsedAchievements = Achievements.parse(achievements);
        return new WowAPICharacter(
            entries.getInteger("id"),
            previous.map(WowAPICharacter::hidden).orElse(false),
            name,
            realm,
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
            parsedAchievements,
            pets.getJsonArray("pets").encode().hashCode(),
            media,
            talents
        );
    }

    public String fullName() {
        return Character.fullNameByRealmAndName(name, realm);
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
        if (entries.getInteger("petHash") == null) {
            entries.put("petHash", -1);
        }
        if (entries.getBoolean("hidden") == null) {
            entries.put("hidden", false);
        }
        return new WowAPICharacter(
            entries.getInteger("id"),
            entries.getBoolean("hidden"),
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
            Achievements.fromJson(entries.getJsonObject("achievements")),
            entries.getInteger("petHash"),
            CharacterMedia.fromJson(entries.getJsonObject("media")),
            Optional.ofNullable(entries.getString("talents")).orElse("")
        );
    }

    public WowAPICharacter updatePvpBracketData(CharAndDiff diff, BracketType bracket, List<Character> withWho) {
        List<PvpBracket> newBrackets = brackets.stream().map(pvpBracket -> {
            PvpBracket res;
            if (BracketType.fromType(pvpBracket.bracketType()).equals(bracket) &&
                (bracket.equals(BracketType.TWO_V_TWO)
                        || bracket.equals(BracketType.THREE_V_THREE)
                        || bracket.equals(BracketType.RBG))) {
                log.debug("Updating bracket " + pvpBracket.bracketType() + " with diff " + diff);
                res = new PvpBracket(
                    pvpBracket.bracketType(),
                    diff.character().rating(),
                    diff.character().wins(),
                    diff.character().losses(),
                    diff.character().pos(),
                    pvpBracket.seasonMaxRating(),
                    pvpBracket.seasonMaxRatingAchievedTimestamp(),
                    pvpBracket.maxRating(),
                    pvpBracket.maxRatingAchievedTimestamp(),
                    pvpBracket.isRankOneRange(),
                    pvpBracket.gamingHistory().addDiff(new DiffAndWithWho(diff.character(), diff.diff(), withWho))
                );
            } else if (BracketType.fromType(pvpBracket.bracketType()).equals(bracket) && bracket.equals(BracketType.SHUFFLE)) {
                String fullSpec = diff.character().fullSpec();
                if (fullSpec.contains(pvpBracket.bracketType().split("-")[1])) {
                    log.debug("Updating bracket " + pvpBracket.bracketType() + " with diff " + diff.toJson().encodePrettily());
                    res = new PvpBracket(
                        pvpBracket.bracketType(),
                        diff.character().rating(),
                        diff.character().wins(),
                        diff.character().losses(),
                        diff.character().pos(),
                        pvpBracket.seasonMaxRating(),
                        pvpBracket.seasonMaxRatingAchievedTimestamp(),
                        pvpBracket.maxRating(),
                        pvpBracket.maxRatingAchievedTimestamp(),
                        pvpBracket.isRankOneRange(),
                        pvpBracket.gamingHistory().addDiff(new DiffAndWithWho(diff.character(), diff.diff(), List.of()))
                    );
                } else {
                    res = pvpBracket;
                }
            } else {
                res = pvpBracket;
            }
            return res;
        }).toList();
        return new WowAPICharacter(id, hidden, name, realm, gender, fraction, race, activeSpec, level, clazz, itemLevel, region, newBrackets, lastUpdatedUTCms, achievements, petHash, media, talents);
    }

    @Override
    public int hashCode() {
        return fullName().hashCode();
    }

    @Override
    public JsonObject toJson() {
        return new JsonObject()
                .put("id", id)
                .put("hidden", hidden)
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
                .put("achievements", achievements.toJson())
                .put("petHash", petHash)
                .put("media", media.toJson())
                .put("talents", talents);
    }

}