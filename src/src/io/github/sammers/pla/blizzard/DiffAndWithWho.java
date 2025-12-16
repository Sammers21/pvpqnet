package io.github.sammers.pla.blizzard;

import io.github.sammers.pla.db.Character;
import io.github.sammers.pla.http.JsonConvertable;
import io.github.sammers.pla.logic.Diff;
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import java.util.List;

record DiffAndWithWho(Character character, Diff diff, List<Character> withWho) implements JsonConvertable {
  @Override
  public JsonObject toJson() {
    JsonObject res = new JsonObject();
    res.put("diff", diff.toJson());
    if (character != null) {
      res.put("character", character.toJson());
    }
    return res.put("diff", diff.toJson())
      .put("with_who", new JsonArray(withWho.stream().map(Character::toJson).toList()));
  }

  public static DiffAndWithWho fromJson(JsonObject entries) {
    JsonArray wwho = entries.getJsonArray("with_who");
    JsonObject charItself = entries.getJsonObject("character");
    Character resChar;
    if (charItself == null) {
      resChar = null;
    } else {
      resChar = Character.fromJson(charItself);
    }
    List<Character> resList;
    if (wwho.isEmpty()) {
      resList = List.of();
    } else {
      boolean isStrings = true;
      for (Object o : wwho) {
        if (!(o instanceof String)) {
          isStrings = false;
          break;
        }
      }
      if (isStrings) {
        // remove after full switch
        resList = wwho.stream().map(String.class::cast).map(Character::emptyFromFullNickname).toList();
      } else {
        resList = wwho.stream().map(JsonObject.class::cast).map(Character::fromJson).toList();
      }
    }
    return new DiffAndWithWho(resChar, Diff.fromJson(entries.getJsonObject("diff")), resList);
  }
}
