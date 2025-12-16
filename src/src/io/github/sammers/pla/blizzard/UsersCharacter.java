package io.github.sammers.pla.blizzard;

import io.vertx.core.json.JsonObject;

import java.util.Optional;

import io.github.sammers.pla.db.Character;

public record UsersCharacter(Long id, String name, String realm, String clazz, String race, String faction,
  Integer level, String region, Optional<WowAPICharacter> resolved) {
  public String fullName() {
    return Character.fullNameByRealmAndName(name, realm);
  }

  public static UsersCharacter fromJson(JsonObject json, String region) {
    Long id = json.getLong("id");
    String name = json.getString("name");
    Object realmObj = json.getValue("realm");
    String realm;
    if (realmObj instanceof String) {
      realm = (String) realmObj;
    } else {
      JsonObject realmJson = (realmObj instanceof JsonObject)
        ? (JsonObject) realmObj
        : (realmObj instanceof java.util.Map) ? new JsonObject((java.util.Map) realmObj) : null;
      realm = Optional.ofNullable(realmJson).map(r -> r.getString("name")).orElse("Unknown");
    }
    Object classObj = json.getValue("playable_class");
    JsonObject classJson = (classObj instanceof JsonObject)
      ? (JsonObject) classObj
      : (classObj instanceof java.util.Map) ? new JsonObject((java.util.Map) classObj) : null;
    String clazz = Optional.ofNullable(classJson)
      .map(c -> c.getString("name"))
      .orElse(json.getString("class", "Unknown"));
    Object raceObj = json.getValue("playable_race");
    JsonObject raceJson = (raceObj instanceof JsonObject)
      ? (JsonObject) raceObj
      : (raceObj instanceof java.util.Map) ? new JsonObject((java.util.Map) raceObj) : null;
    String race = Optional.ofNullable(raceJson).map(r -> r.getString("name")).orElse(json.getString("race", "Unknown"));
    Object factionObj = json.getValue("faction");
    String faction;
    if (factionObj instanceof String) {
      faction = (String) factionObj;
    } else {
      JsonObject factionJson = (factionObj instanceof JsonObject)
        ? (JsonObject) factionObj
        : (factionObj instanceof java.util.Map) ? new JsonObject((java.util.Map) factionObj) : null;
      faction = Optional.ofNullable(factionJson)
        .map(f -> f.getString("type"))
        .orElse(json.getString("faction", "Unknown"));
    }
    Integer level = json.getInteger("level");
    String effectiveRegion = json.getString("region", region);
    return new UsersCharacter(id, name, realm, clazz, race, faction, level, effectiveRegion, Optional.empty());
  }

  public JsonObject toJson() {
    JsonObject json = new JsonObject().put("id", id)
      .put("name", name)
      .put("realm", realm)
      .put("class", clazz)
      .put("race", race)
      .put("faction", faction)
      .put("level", level)
      .put("region", region);
    resolved.ifPresent(r -> json.put("resolved", r.toJson()));
    return json;
  }

  public UsersCharacter withResolved(WowAPICharacter resolved) {
    return new UsersCharacter(id, name, realm, clazz, race, faction, level, region, Optional.ofNullable(resolved));
  }
}
