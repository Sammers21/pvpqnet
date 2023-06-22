package io.github.sammers.pla.db;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public record Spec(String specName, Map<String, Double> winRates) implements JsonConvertable {

    public static Set<String> TANK_SPECS = Set.of(
        "Protection Warrior",
        "Protection Paladin",
        "Guardian Druid",
        "Brewmaster Monk",
        "Vengeance Demon Hunter"
    );

    public static Set<String> HEAL_SPECS = Set.of(
        "Holy Paladin",
        "Restoration Druid",
        "Restoration Shaman",
        "Mistweaver Monk",
        "Holy Priest",
        "Discipline Priest",
        "Preservation Evoker"
    );

    public static Set<String> MELEE_SPECS = Set.of(
        "Arms Warrior",
        "Fury Warrior",
        "Retribution Paladin",
        "Feral Druid",
        "Windwalker Monk",
        "Havoc Demon Hunter",
        "Assassination Rogue",
        "Outlaw Rogue",
        "Subtlety Rogue",
        "Enhancement Shaman",
        "Unholy Death Knight",
        "Frost Death Knight",
        "Survival Hunter"
    );

    public static Set<String> RANGED_SPECS = Set.of(
        "Balance Druid",
        "Beast Mastery Hunter",
        "Marksmanship Hunter",
        "Survival Hunter",
        "Arcane Mage",
        "Fire Mage",
        "Frost Mage",
        "Shadow Priest",
        "Elemental Shaman",
        "Affliction Warlock",
        "Demonology Warlock",
        "Destruction Warlock"
    );

    public static Set<String> DPS_SPECS = Stream.concat(RANGED_SPECS.stream(), MELEE_SPECS.stream()).collect(Collectors.toSet());
    public static Set<String> ALL_SPECS = Stream.concat(DPS_SPECS.stream(), Stream.concat(HEAL_SPECS.stream(), TANK_SPECS.stream())).collect(Collectors.toSet());

    @Override
    public JsonObject toJson() {
        JsonObject res = new JsonObject().put("spec_name", specName);
        for (Map.Entry<String, Double> entry : winRates.entrySet()) {
            res.put(entry.getKey(), entry.getValue());
        }
        return res;
    }
}
