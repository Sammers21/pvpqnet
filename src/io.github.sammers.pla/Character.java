package io.github.sammers.pla;


import io.vertx.core.json.JsonObject;

public record Character(Long pos, Long rating, boolean inCutoff, String name, String clazz, String fullSpec, String fraction,
                        String gender, String race,
                        String realm, Long wins, Long losses) implements JsonConvertable {
    public String fullNameWClass() {
        return name + " " + realm + " " + clazz;
    }

    public String fullName() {
        return Character.fullNameByRealmAndName(name(), realm());
    }

    public static String fullNameByRealmAndName(String name, String realm) {
        return (name + "-" + realm.replaceAll(" ", "-").replaceAll("'", "")).toLowerCase();
    }

    public String fullNameWSpec() {
        return name + " " + realm + " " + fullSpec;
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

    public static Character withWinsAndLossesAndPosAndRating(Character character, Long wins, Long losses, Long pos, Long rating) {
        return new Character(pos, rating,character.inCutoff(), character.name(), character.clazz(), character.fullSpec(), character.fraction(),
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
            gender = entries.getString("race");
        }
        return new Character(entries.getLong("pos"), entries.getLong("rating"), inCutoff, entries.getString("name"),
            entries.getString("class"), entries.getString("full_spec"), entries.getString("fraction"), gender, race,
            entries.getString("realm"), entries.getLong("wins"), entries.getLong("losses"));
    }
}
