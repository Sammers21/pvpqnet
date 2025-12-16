package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.db.Snapshot;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.logic.Calculator;
import io.github.sammers.pla.logic.CharAndDiff;
import io.github.sammers.pla.logic.CharacterCache;
import io.github.sammers.pla.logic.Refs;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import org.slf4j.Logger;

import java.time.Instant;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * WoW API character. Example of JSON: { "_links": { "self": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask?namespace=profile-eu"
 * } }, "id": 209902508, "name": "Whitemask", "gender": { "type": "FEMALE",
 * "name": "Female" }, "faction": { "type": "HORDE", "name": "Horde" }, "race":
 * { "key": { "href":
 * "https://eu.api.blizzard.com/data/wow/playable-race/5?namespace=static-10.0.7_48520-eu"
 * }, "name": "Undead", "id": 5 }, "character_class": { "key": { "href":
 * "https://eu.api.blizzard.com/data/wow/playable-class/5?namespace=static-10.0.7_48520-eu"
 * }, "name": "Priest", "id": 5 }, "active_spec": { "key": { "href":
 * "https://eu.api.blizzard.com/data/wow/playable-specialization/257?namespace=static-10.0.7_48520-eu"
 * }, "name": "Holy", "id": 257 }, "realm": { "key": { "href":
 * "https://eu.api.blizzard.com/data/wow/realm/1305?namespace=dynamic-eu" },
 * "name": "Kazzak", "id": 1305, "slug": "kazzak" }, "level": 70, "experience":
 * 0, "achievement_points": 1935, "achievements": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/achievements?namespace=profile-eu"
 * }, "titles": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/titles?namespace=profile-eu"
 * }, "pvp_summary": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/pvp-summary?namespace=profile-eu"
 * }, "encounters": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/encounters?namespace=profile-eu"
 * }, "media": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/character-media?namespace=profile-eu"
 * }, "last_login_timestamp": 1679688656000, "average_item_level": 401,
 * "equipped_item_level": 401, "specializations": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/specializations?namespace=profile-eu"
 * }, "statistics": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/statistics?namespace=profile-eu"
 * }, "mythic_keystone_profile": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/mythic-keystone-profile?namespace=profile-eu"
 * }, "equipment": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/equipment?namespace=profile-eu"
 * }, "appearance": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/appearance?namespace=profile-eu"
 * }, "collections": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/collections?namespace=profile-eu"
 * }, "reputations": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/reputations?namespace=profile-eu"
 * }, "quests": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/quests?namespace=profile-eu"
 * }, "achievements_statistics": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/achievements/statistics?namespace=profile-eu"
 * }, "professions": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/professions?namespace=profile-eu"
 * }, "covenant_progress": { "chosen_covenant": { "key": { "href":
 * "https://eu.api.blizzard.com/data/wow/covenant/1?namespace=static-10.0.7_48520-eu"
 * }, "name": "Kyrian", "id": 1 }, "renown_level": 80, "soulbinds": { "href":
 * "https://eu.api.blizzard.com/profile/wow/character/kazzak/whitemask/soulbinds?namespace=profile-eu"
 * } } }
 */
public record WowAPICharacter(long id, boolean hidden, String name, String realm, String gender, String fraction,
  String race, String activeSpec, int level, String clazz, int itemLevel, String region, List<PvpBracket> brackets,
  Long lastUpdatedUTCms, Achievements achievements, int petHash, CharacterMedia media, String talents,
  List<PvpTalent> pvpTalents, Set<Long> alts) implements JsonConvertable {

  private static final Logger log = org.slf4j.LoggerFactory.getLogger(WowAPICharacter.class);
  public static WowAPICharacter parse(CharacterCache cache, Optional<WowAPICharacter> previous, Refs refs,
    Optional<Cutoffs> cutoffs, JsonObject entries, JsonObject pvpSummary, List<JsonObject> brackets,
    Optional<JsonObject> achievements, Optional<JsonObject> characterMedia, Optional<JsonObject> specs,
    Optional<JsonObject> pets, String region) {
    String activeSpec = Optional.ofNullable(entries.getJsonObject("active_spec"))
      .map(obj -> obj.getString("name"))
      .orElse("");
    String talents = specs.map(s -> parseTalentsFromSpecs(s, activeSpec))
      .orElseGet(() -> previous.map(WowAPICharacter::talents).orElse(""));
    Map<String, PvpBracket> prevBrackets = previous.map(wowAPICharacter -> wowAPICharacter.brackets.stream()
      .collect(Collectors.toMap(PvpBracket::bracketType, Function.identity()))).orElse(Map.of());
    String name = entries.getString("name").substring(0, 1).toUpperCase() + entries.getString("name").substring(1);
    String realm = Calculator.realmCalc(entries.getJsonObject("realm").getString("name"));
    List<PvpBracket> pvpBrackets = brackets.stream().map((JsonObject wowApiBracket) -> {
      boolean thisSsnData = wowApiBracket.getJsonObject("season")
        .getInteger("id")
        .equals(BlizzardAPI.CURRENT_PVP_SEASON_ID);
      String btype = wowApiBracket.getJsonObject("bracket").getString("type");
      Snapshot latest = refs.snapshotByBracketType(btype, BlizzardAPI.oldRegion(region));
      Long rank = Optional.ofNullable(latest)
        .map(s -> s.findChar(Character.fullNameByRealmAndName(name, realm)))
        .map(foundChars -> {
          if (foundChars.isEmpty()) {
            return -1L;
          } else if (foundChars.size() == 1) {
            return foundChars.get(0).pos();
          } else {
            Long finalPos = -1L;
            if (btype.equals("SHUFFLE") || btype.equals("BLITZ")) {
              String spec = wowApiBracket.getJsonObject("specialization").getString("name");
              // Use normalized comparison
              // to handle format
              // differences like
              // "Beastmastery Hunter" vs
              // "Beast Mastery Hunter"
              finalPos = foundChars.stream()
                .filter(c -> Cutoffs.fullSpecContainsSpec(c.fullSpec(), spec))
                .findFirst()
                .map(Character::pos)
                .orElse(-1L);
            }
            return finalPos;
          }
        })
        .orElse(-1L);
      Long cutoffByBracketType;
      Optional<PvpBracket> prevBracket;
      if (btype.equals("SHUFFLE") || btype.equals("BLITZ")) {
        String spec = wowApiBracket.getJsonObject("specialization").getString("name");
        Long id = wowApiBracket.getJsonObject("specialization").getLong("id");
        String specCode = Cutoffs.specCodeNameById(spec, id);
        cutoffByBracketType = cutoffs.map(c -> c.shuffle(specCode)).orElse(Long.MAX_VALUE);
        prevBracket = Optional.ofNullable(prevBrackets.get(btype + "-" + spec));
      } else {
        cutoffByBracketType = cutoffs.map(c -> c.cutoffByBracketType(btype)).orElse(Long.MAX_VALUE);
        prevBracket = Optional.ofNullable(prevBrackets.get(btype));
      }
      return PvpBracket.parse(wowApiBracket, prevBracket, rank, Optional.of(cutoffByBracketType).orElse(-1L),
        thisSsnData);
    }).toList();
    CharacterMedia media = characterMedia.map(CharacterMedia::parse)
      .orElseGet(() -> previous.map(WowAPICharacter::media).orElse(CharacterMedia.fromJson(null)));
    Long lastUpdatedUTCms = Instant.now().toEpochMilli();
    Achievements parsedAchievements = achievements.map(Achievements::parse)
      .orElseGet(() -> previous.map(WowAPICharacter::achievements).orElse(Achievements.fromJson(null)));
    Long id = entries.getLong("id");
    int petHash = pets.map(p -> Optional.ofNullable(p.getJsonArray("pets")).map(JsonArray::hashCode).orElse(-1))
      .orElseGet(() -> previous.map(WowAPICharacter::petHash).orElse(-1));
    Set<Long> alts = cache.alts.getOrDefault(petHash, new HashSet<>(0));
    previous.ifPresent(wowAPICharacter -> alts.addAll(wowAPICharacter.alts));
    List<PvpTalent> pvpTalents = specs.map(s -> PvpTalent.parseFromSpecs(s, activeSpec))
      .orElseGet(() -> previous.map(WowAPICharacter::pvpTalents).orElse(List.of()));
    return new WowAPICharacter(id, previous.map(WowAPICharacter::hidden).orElse(false), name, realm,
      entries.getJsonObject("gender").getString("name"), entries.getJsonObject("faction").getString("name"),
      entries.getJsonObject("race").getString("name"), activeSpec, entries.getInteger("level"),
      entries.getJsonObject("character_class").getString("name"), entries.getInteger("equipped_item_level"), region,
      pvpBrackets, lastUpdatedUTCms, parsedAchievements, petHash, media, talents, pvpTalents, alts);
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
    Set<Long> alts;
    JsonArray altsArr = entries.getJsonArray("alts");
    if (altsArr == null) {
      alts = new HashSet<>(0);
    } else {
      alts = new HashSet<>(altsArr.stream().map(o -> Long.valueOf(o.toString())).collect(Collectors.toSet()));
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
    List<PvpTalent> pvpTalentsFromJson;
    JsonArray pvpTalentsArr = entries.getJsonArray("pvpTalents");
    if (pvpTalentsArr == null) {
      pvpTalentsFromJson = List.of();
    } else {
      pvpTalentsFromJson = pvpTalentsArr.stream().map(o -> PvpTalent.fromJson((JsonObject) o)).toList();
    }
    return new WowAPICharacter(entries.getInteger("id"), entries.getBoolean("hidden"), entries.getString("name"),
      entries.getString("realm"), entries.getString("gender"), entries.getString("fraction"), entries.getString("race"),
      entries.getString("activeSpec"), entries.getInteger("level"), entries.getString("class"),
      entries.getInteger("itemLevel"), entries.getString("region"), brcktsFromJson, entries.getLong("lastUpdatedUTCms"),
      Achievements.fromJson(entries.getJsonObject("achievements")), entries.getInteger("petHash"),
      CharacterMedia.fromJson(entries.getJsonObject("media")),
      Optional.ofNullable(entries.getString("talents")).orElse(""), pvpTalentsFromJson, alts);
  }

  public WowAPICharacter changeAlts(Set<Long> newAlts) {
    return new WowAPICharacter(id, hidden, name, realm, gender, fraction, race, activeSpec, level, clazz, itemLevel,
      region, brackets, lastUpdatedUTCms, achievements, petHash, media, talents, pvpTalents, newAlts);
  }

  public WowAPICharacter withHidden(boolean newHidden) {
    return new WowAPICharacter(id, newHidden, name, realm, gender, fraction, race, activeSpec, level, clazz, itemLevel,
      region, brackets, lastUpdatedUTCms, achievements, petHash, media, talents, pvpTalents, alts);
  }

  public WowAPICharacter mergeFromPrevious(WowAPICharacter previous) {
    if (previous == null) {
      return this;
    }
    boolean mergedHidden = hidden || previous.hidden();
    Map<String, PvpBracket> prevBrackets = previous.brackets == null
      ? Map.of()
      : previous.brackets.stream().collect(Collectors.toMap(PvpBracket::bracketType, Function.identity(), (a, b) -> a));
    List<PvpBracket> mergedBrackets = brackets == null ? List.of() : brackets.stream().map(b -> {
      PvpBracket prev = prevBrackets.get(b.bracketType());
      if (prev == null) {
        return b;
      }
      Long seasonMaxRating = Math.max(b.rating(), prev.seasonMaxRating());
      Long seasonMaxTs = seasonMaxRating.equals(b.rating()) && !seasonMaxRating.equals(prev.seasonMaxRating())
        ? System.currentTimeMillis()
        : prev.seasonMaxRatingAchievedTimestamp();
      Long maxRating = Math.max(b.rating(), prev.maxRating());
      Long maxTs = maxRating.equals(b.rating()) && !maxRating.equals(prev.maxRating())
        ? System.currentTimeMillis()
        : prev.maxRatingAchievedTimestamp();
      return new PvpBracket(b.bracketType(), b.rating(), b.won(), b.lost(), b.rank(), seasonMaxRating, seasonMaxTs,
        maxRating, maxTs, b.isRankOneRange(), prev.gamingHistory());
    }).toList();
    Set<Long> mergedAlts = new HashSet<>(alts == null ? Set.of() : alts);
    if (previous.alts != null) {
      mergedAlts.addAll(previous.alts);
    }
    mergedAlts.remove(id);
    return new WowAPICharacter(id, mergedHidden, name, realm, gender, fraction, race, activeSpec, level, clazz,
      itemLevel, region, mergedBrackets, lastUpdatedUTCms, achievements, petHash, media, talents, pvpTalents,
      mergedAlts);
  }

  public WowAPICharacter mergeFromPreviousWithCombinedGamingHistory(WowAPICharacter previous) {
    if (previous == null) {
      return this;
    }
    boolean mergedHidden = hidden || previous.hidden();
    Map<String, PvpBracket> thisBrackets = brackets == null
      ? Map.of()
      : brackets.stream()
        .filter(Objects::nonNull)
        .collect(Collectors.toMap(PvpBracket::bracketType, Function.identity(), (a, b) -> a, LinkedHashMap::new));
    Map<String, PvpBracket> prevBrackets = previous.brackets == null
      ? Map.of()
      : previous.brackets.stream()
        .filter(Objects::nonNull)
        .collect(Collectors.toMap(PvpBracket::bracketType, Function.identity(), (a, b) -> a));
    LinkedHashSet<String> types = new LinkedHashSet<>();
    types.addAll(thisBrackets.keySet());
    types.addAll(prevBrackets.keySet());
    List<PvpBracket> mergedBrackets = new ArrayList<>(types.size());
    for (String type : types) {
      PvpBracket current = thisBrackets.get(type);
      PvpBracket prev = prevBrackets.get(type);
      if (current == null) {
        mergedBrackets.add(prev);
        continue;
      }
      if (prev == null) {
        mergedBrackets.add(current);
        continue;
      }
      Long curSeasonMax = current.seasonMaxRating() == null ? current.rating() : current.seasonMaxRating();
      Long prevSeasonMax = prev.seasonMaxRating() == null ? prev.rating() : prev.seasonMaxRating();
      Long seasonMaxRating = Math.max(curSeasonMax, prevSeasonMax);
      Long seasonMaxTs;
      if (Objects.equals(seasonMaxRating, curSeasonMax) && !Objects.equals(seasonMaxRating, prevSeasonMax)) {
        seasonMaxTs = current.seasonMaxRatingAchievedTimestamp();
      } else if (Objects.equals(seasonMaxRating, prevSeasonMax) && !Objects.equals(seasonMaxRating, curSeasonMax)) {
        seasonMaxTs = prev.seasonMaxRatingAchievedTimestamp();
      } else {
        seasonMaxTs = Math.max(Optional.ofNullable(current.seasonMaxRatingAchievedTimestamp()).orElse(-1L),
          Optional.ofNullable(prev.seasonMaxRatingAchievedTimestamp()).orElse(-1L));
      }
      Long curMax = current.maxRating() == null ? current.rating() : current.maxRating();
      Long prevMax = prev.maxRating() == null ? prev.rating() : prev.maxRating();
      Long maxRating = Math.max(curMax, prevMax);
      Long maxTs;
      if (Objects.equals(maxRating, curMax) && !Objects.equals(maxRating, prevMax)) {
        maxTs = current.maxRatingAchievedTimestamp();
      } else if (Objects.equals(maxRating, prevMax) && !Objects.equals(maxRating, curMax)) {
        maxTs = prev.maxRatingAchievedTimestamp();
      } else {
        maxTs = Math.max(Optional.ofNullable(current.maxRatingAchievedTimestamp()).orElse(-1L),
          Optional.ofNullable(prev.maxRatingAchievedTimestamp()).orElse(-1L));
      }
      GamingHistory mergedHistory = mergeGamingHistory(current.gamingHistory(), prev.gamingHistory());
      mergedBrackets.add(new PvpBracket(current.bracketType(), current.rating(), current.won(), current.lost(),
        current.rank(), seasonMaxRating, seasonMaxTs, maxRating, maxTs, current.isRankOneRange(), mergedHistory));
    }
    Set<Long> mergedAlts = new HashSet<>(alts == null ? Set.of() : alts);
    if (previous.alts != null) {
      mergedAlts.addAll(previous.alts);
    }
    mergedAlts.remove(id);
    return new WowAPICharacter(id, mergedHidden, name, realm, gender, fraction, race, activeSpec, level, clazz,
      itemLevel, region, mergedBrackets, lastUpdatedUTCms, achievements, petHash, media, talents, pvpTalents,
      mergedAlts);
  }

  private static GamingHistory mergeGamingHistory(GamingHistory current, GamingHistory previous) {
    if (current == null || current.hist() == null || current.hist().isEmpty()) {
      return previous == null ? new GamingHistory(new ArrayList<>()) : previous;
    }
    if (previous == null || previous.hist() == null || previous.hist().isEmpty()) {
      return current;
    }
    List<DiffAndWithWho> merged = new ArrayList<>(current.hist().size() + previous.hist().size());
    merged.addAll(current.hist());
    merged.addAll(previous.hist());
    merged.sort(Comparator.comparingLong(d -> {
      if (d == null || d.diff() == null || d.diff().timestamp() == null) {
        return 0L;
      }
      return d.diff().timestamp();
    }));
    int maxSize = 10_000;
    if (merged.size() > maxSize) {
      merged = new ArrayList<>(merged.subList(merged.size() - maxSize, merged.size()));
    }
    return new GamingHistory(merged).clean();
  }

  public WowAPICharacter updatePvpBracketData(CharAndDiff diff, BracketType bracket, List<Character> withWho) {
    List<PvpBracket> newBrackets = brackets.stream().map(pvpBracket -> {
      PvpBracket res;
      if (BracketType.fromType(pvpBracket.bracketType()).equals(bracket) && (bracket.equals(BracketType.TWO_V_TWO)
        || bracket.equals(BracketType.THREE_V_THREE) || bracket.equals(BracketType.RBG))) {
        log.debug("Updating bracket " + pvpBracket.bracketType() + " with diff " + diff);
        Long newRating = diff.character().rating();
        Long newSeasonMaxRating = Math.max(newRating, pvpBracket.seasonMaxRating());
        Long newSeasonMaxRatingAchievedTimestamp = newSeasonMaxRating.equals(newRating)
          && !newSeasonMaxRating.equals(pvpBracket.seasonMaxRating())
            ? System.currentTimeMillis()
            : pvpBracket.seasonMaxRatingAchievedTimestamp();
        Long newMaxRating = Math.max(newRating, pvpBracket.maxRating());
        Long newMaxRatingAchievedTimestamp = newMaxRating.equals(newRating)
          && !newMaxRating.equals(pvpBracket.maxRating())
            ? System.currentTimeMillis()
            : pvpBracket.maxRatingAchievedTimestamp();
        res = new PvpBracket(pvpBracket.bracketType(), newRating, diff.character().wins(), diff.character().losses(),
          diff.character().pos(), newSeasonMaxRating, newSeasonMaxRatingAchievedTimestamp, newMaxRating,
          newMaxRatingAchievedTimestamp, pvpBracket.isRankOneRange(),
          pvpBracket.gamingHistory().addDiff(new DiffAndWithWho(diff.character(), diff.diff(), withWho)).clean());
      } else if (BracketType.fromType(pvpBracket.bracketType()).equals(bracket)
        && (bracket.equals(BracketType.SHUFFLE) | bracket.equals(BracketType.BLITZ))) {
        String fullSpec = diff.character().fullSpec();
        String[] split = pvpBracket.bracketType().split("-");
        if (split.length > 1 && fullSpec.contains(split[1])) {
          log.debug("Updating bracket " + pvpBracket.bracketType() + " with diff " + diff.toJson().encodePrettily());
          Long newRating = diff.character().rating();
          Long newSeasonMaxRating = Math.max(newRating, pvpBracket.seasonMaxRating());
          Long newSeasonMaxRatingAchievedTimestamp = newSeasonMaxRating.equals(newRating)
            && !newSeasonMaxRating.equals(pvpBracket.seasonMaxRating())
              ? System.currentTimeMillis()
              : pvpBracket.seasonMaxRatingAchievedTimestamp();
          Long newMaxRating = Math.max(newRating, pvpBracket.maxRating());
          Long newMaxRatingAchievedTimestamp = newMaxRating.equals(newRating)
            && !newMaxRating.equals(pvpBracket.maxRating())
              ? System.currentTimeMillis()
              : pvpBracket.maxRatingAchievedTimestamp();
          res = new PvpBracket(pvpBracket.bracketType(), newRating, diff.character().wins(), diff.character().losses(),
            diff.character().pos(), newSeasonMaxRating, newSeasonMaxRatingAchievedTimestamp, newMaxRating,
            newMaxRatingAchievedTimestamp, pvpBracket.isRankOneRange(),
            pvpBracket.gamingHistory().addDiff(new DiffAndWithWho(diff.character(), diff.diff(), List.of())).clean());
        } else {
          res = pvpBracket;
        }
      } else {
        res = pvpBracket;
      }
      return res;
    }).toList();
    return new WowAPICharacter(id, hidden, name, realm, gender, fraction, race, activeSpec, level, clazz, itemLevel,
      region, newBrackets, lastUpdatedUTCms, achievements, petHash, media, talents, pvpTalents, alts);
  }

  public byte[] toGzippedJson() {
    return Calculator.gzipCompress(toJson().encode().getBytes());
  }

  public static WowAPICharacter fromGzippedJson(byte[] gzippedJson) {
    if (gzippedJson == null) {
      return null;
    }
    return fromJson(new JsonObject(new String(Calculator.gzipUncompress(gzippedJson))));
  }

  @Override
  public int hashCode() {
    return (int) id;
  }

  @Override
  public JsonObject toJson() {
    return new JsonObject().put("id", id)
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
      .put("talents", talents)
      .put("pvpTalents", new JsonArray(pvpTalents.stream().map(PvpTalent::toJson).toList()))
      .put("alts", new JsonArray(alts.stream().toList()));
  }

  private static String parseTalentsFromSpecs(JsonObject specs, String activeSpec) {
    JsonArray specializations = specs.getJsonArray("specializations");
    if (specializations == null) {
      return "";
    }
    return specializations.stream().map(JsonObject.class::cast).filter(s -> {
      JsonObject specialization = s.getJsonObject("specialization");
      return specialization != null && activeSpec.equals(specialization.getString("name"));
    }).findFirst().map(s -> {
      JsonArray loadouts = s.getJsonArray("loadouts");
      if (loadouts == null || loadouts.isEmpty()) {
        return "";
      }
      JsonObject loadout = loadouts.getJsonObject(0);
      if (loadout == null) {
        return "";
      }
      return loadout.getString("talent_loadout_code", "");
    }).orElse("");
  }
}
