package io.github.sammers.pla.db;


import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import static io.github.sammers.pla.db.Spec.HEAL_SPECS;
import static io.github.sammers.pla.logic.Conts.*;

public record Character(Long pos, Long rating, boolean inCutoff, String name, String clazz, String fullSpec,
                        String fraction,
                        String gender, String race,
                        String realm, Long wins, Long losses) implements JsonConvertable {

    public static Character emptyFromFullNickname(String fullNickname) {
        String[] split = fullNickname.split("-");
        return new Character(-1L, -1L, false, split[0], "", "", "", "", "", split[1], -1L, -1L);
    }

    public Character changeCutoff(boolean inCutoff) {
        return new Character(pos, rating, inCutoff, name, clazz, fullSpec, fraction, gender, race, realm, wins, losses);
    }

    public String fullSpec() {
        return fullSpec.trim();
    }

    public String fullNameWClass() {
        return fullName() + " " + clazz.trim();
    }

    public String fullName() {
        return Character.fullNameByRealmAndName(name(), realm());
    }

    public static String fullNameByRealmAndName(String name, String realm) {
        String realmReplaced = TIRE.matcher(SPACE.matcher(realm).replaceAll("-")).replaceAll("");
        return String.format("%s-%s", name.trim(), realmReplaced.trim()).toLowerCase();
    }

    public String fullNameWSpec() {
        return String.format("%s %s", fullName(), SPACE.matcher(fullSpec()).replaceAll("")).toLowerCase();
    }

    public JsonObject toJson() {
        return new JsonObject()
            .put("pos", pos)
            .put("rating", rating)
            .put("in_cutoff", inCutoff)
            .put("name", name)
            .put("class", clazz)
            .put("full_spec", fullSpec)
            .put("fraction", fraction)
            .put("gender", gender)
            .put("race", race)
            .put("realm", realm)
            .put("wins", wins)
            .put("losses", losses);
    }

    public boolean isHealerSpec() {
        return HEAL_SPECS.contains(fullSpec());
    }

    public boolean isTankSpec() {
        return Spec.TANK_SPECS.contains(fullSpec());
    }

    public boolean isDpsSpec() {
        return Spec.DPS_SPECS.contains(fullSpec());
    }

    public static Character withWinsAndLossesAndPosAndRating(Character character, Long wins, Long losses, Long pos, Long rating) {
        return new Character(pos, rating, character.inCutoff(), character.name(), character.clazz(), character.fullSpec(), character.fraction(),
            character.gender(), character.race(),
            character.realm(), wins, losses);
    }

    public static Character fromJson(JsonObject entries) {
        String gender = "unknown";
        String race = "unknown";
        boolean inCutoff = false;
        if (entries.containsKey("in_cutoff")) {
            inCutoff = entries.getBoolean("in_cutoff");
        }
        if (entries.containsKey("gender")) {
            gender = entries.getString("gender");
        }
        if (entries.containsKey("race")) {
            race = entries.getString("race");
        }
        return new Character(entries.getLong("pos"), entries.getLong("rating"), inCutoff, entries.getString("name"),
            entries.getString("class"), entries.getString("full_spec"), entries.getString("fraction"), gender, race,
            entries.getString("realm"), entries.getLong("wins"), entries.getLong("losses"));
    }

    public Character changeRealmName(String newRealm) {
        return new Character(
             pos,
             rating,
             inCutoff,
             name,
             clazz,
             fullSpec,
             fraction,
             gender,
             race,
             newRealm,
             wins,
             losses);
    }
}
