package io.github.sammers.pla.db;

import io.github.sammers.pla.blizzard.UsersCharacter;
import io.github.sammers.pla.blizzard.WowAPICharacter;
import io.github.sammers.pla.blizzard.BlizzardAPI;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

public record User(BattleNetInfo battleNetInfo, List<UsersCharacter> characters,
  Optional<BattleNetAccessToken> battleNetAccessToken, List<PvPQNetSession> sessions) {
  public JsonObject toJson() {
    JsonObject json = new JsonObject().put("battlenet_id", battleNetInfo.id())
      .put("battletag", battleNetInfo.battletag())
      .put("characters", new JsonArray(characters.stream().map(UsersCharacter::toJson).toList()));
    battleNetAccessToken.ifPresent(token -> json.put("battlenet_access_token", token.toJson()));
    if (!sessions.isEmpty()) {
      json.put("sessions", new JsonArray(sessions.stream().map(PvPQNetSession::toJson).toList()));
    }
    return json;
  }

  public JsonObject toPublicJson() {
    return new JsonObject().put("battlenet_id", battleNetInfo.id())
      .put("battletag", battleNetInfo.battletag())
      .put("characters", new JsonArray(characters.stream().map(UsersCharacter::toJson).toList()));
  }

  public User withNewCharacters(List<UsersCharacter> newCharacters) {
    return new User(battleNetInfo, newCharacters, battleNetAccessToken, sessions);
  }

  public boolean hashCharacter(String region, String nickname) {
    if (region == null || nickname == null || characters == null) {
      return false;
    }
    String normalizedRegion = BlizzardAPI.realRegion(region.toLowerCase());
    String normalizedNickname = nickname.trim().toLowerCase().replaceAll(" +", "-").replace("'", "");
    return characters.stream().filter(java.util.Objects::nonNull).anyMatch(ch -> {
      String chRegion = BlizzardAPI.realRegion(Optional.ofNullable(ch.region()).orElse("").toLowerCase());
      if (!normalizedRegion.equalsIgnoreCase(chRegion)) {
        return false;
      }
      return Character.fullNameByRealmAndName(ch.name(), ch.realm()).equalsIgnoreCase(normalizedNickname);
    });
  }

  public static User fromJson(JsonObject json) {
    BattleNetInfo bni = new BattleNetInfo(json.getLong("battlenet_id"), json.getString("battletag"));
    Object charsObj = json.getValue("characters");
    JsonArray charsArray = (charsObj instanceof JsonArray)
      ? (JsonArray) charsObj
      : (charsObj instanceof java.util.List) ? new JsonArray((java.util.List) charsObj) : new JsonArray();
    List<UsersCharacter> chars = charsArray.stream().map(o -> {
      if (o instanceof JsonObject) {
        UsersCharacter c = UsersCharacter.fromJson((JsonObject) o, "unknown");
        Object resolvedObj = ((JsonObject) o).getValue("resolved");
        if (resolvedObj instanceof JsonObject) {
          c = c.withResolved(WowAPICharacter.fromJson((JsonObject) resolvedObj));
        } else if (resolvedObj instanceof java.util.Map) {
          c = c.withResolved(WowAPICharacter.fromJson(new JsonObject((java.util.Map) resolvedObj)));
        }
        return c;
      } else if (o instanceof java.util.Map) {
        JsonObject jsonObject = new JsonObject((java.util.Map) o);
        UsersCharacter c = UsersCharacter.fromJson(jsonObject, "unknown");
        Object resolvedObj = jsonObject.getValue("resolved");
        if (resolvedObj instanceof JsonObject) {
          c = c.withResolved(WowAPICharacter.fromJson((JsonObject) resolvedObj));
        } else if (resolvedObj instanceof java.util.Map) {
          c = c.withResolved(WowAPICharacter.fromJson(new JsonObject((java.util.Map) resolvedObj)));
        }
        return c;
      } else {
        // Fallback or error handling if needed, though usually it should be JsonObject
        return null;
      }
    }).filter(java.util.Objects::nonNull).toList();
    // Fix region for characters if possible, though UsersCharacter.fromJson usually
    // takes region as arg.
    // In previous implementation we passed region. Here we are reading from DB
    // where region should be stored inside the character object?
    // Let's check UsersCharacter.java. It has a region field.
    // The previous implementation of UsersCharacter.toJson included region.
    // So UsersCharacter.fromJson reads it from the json object if I update it to do
    // so.
    Object tokenObj = json.getValue("battlenet_access_token");
    JsonObject tokenJson = (tokenObj instanceof JsonObject)
      ? (JsonObject) tokenObj
      : (tokenObj instanceof java.util.Map) ? new JsonObject((java.util.Map) tokenObj) : null;
    Optional<BattleNetAccessToken> token = Optional.ofNullable(tokenJson).map(BattleNetAccessToken::fromJson);
    Object sessionsObj = json.getValue("sessions");
    JsonArray sessionsArray = (sessionsObj instanceof JsonArray)
      ? (JsonArray) sessionsObj
      : (sessionsObj instanceof java.util.List) ? new JsonArray((java.util.List) sessionsObj) : new JsonArray();
    List<PvPQNetSession> sessions = sessionsArray.stream().map(o -> {
      if (o instanceof JsonObject) {
        return PvPQNetSession.fromJson((JsonObject) o);
      } else if (o instanceof java.util.Map) {
        return PvPQNetSession.fromJson(new JsonObject((java.util.Map) o));
      }
      return null;
    }).filter(java.util.Objects::nonNull).collect(Collectors.toList());
    return new User(bni, chars, token, sessions);
  }
}
