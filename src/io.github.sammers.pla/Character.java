package io.github.sammers.pla;


import io.vertx.core.json.JsonObject;

public record Character(Long pos, Long rating, String name, String clazz, String fullSpec, String fraction,
                        String realm, Long wins, Long losses) implements JsonConvertable {
    public String fullNameWClass() {
        return name + " " + realm + " " + clazz;
    }

    public String fullName() {
        return (name() + "-" + realm().replaceAll(" ", "-")
            .replaceAll("'", "")).toLowerCase();
    }

    public String fullNameWSpec() {
        return name + " " + realm + " " + fullSpec;
    }

    public JsonObject toJson() {
        return new JsonObject()
            .put("pos", pos)
            .put("rating", rating)
            .put("name", name)
            .put("class", clazz)
            .put("full_spec", fullSpec)
            .put("fraction", fraction)
            .put("realm", realm)
            .put("wins", wins)
            .put("losses", losses);
    }

    public static Character withWinsAndLossesAndPosAndRating(Character character, Long wins, Long losses, Long pos, Long rating) {
        return new Character(pos, rating, character.name(), character.clazz(), character.fullSpec(), character.fraction(),
            character.realm(), wins, losses);
    }
    public static Character fromJson(JsonObject entries) {
        return new Character(entries.getLong("pos"), entries.getLong("rating"), entries.getString("name"),
            entries.getString("class"), entries.getString("full_spec"), entries.getString("fraction"),
            entries.getString("realm"), entries.getLong("wins"), entries.getLong("losses"));
    }
}
