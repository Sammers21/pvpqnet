package io.github.sammers.pla.db;

import io.github.sammers.pla.http.JsonConvertable;
import io.vertx.core.json.JsonObject;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public record Spec(String specName,
                   double p001WinRate,
                   double p001Presence,
                   double p01WinRate,
                   double p01Presence,
                   double p10WinRate,
                   double p10Presence,
                   double p35WinRate,
                   double p35Presence,
                   double p50WinRate,
                   double p50Presence,
                   double p100WinRate,
                   double p100Presence) implements JsonConvertable {

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
        return new JsonObject()
            .put("spec_name", specName)
            .put("p001_win_rate", p001WinRate)
            .put("p001_presence", p001Presence)
            .put("p01_win_rate", p01WinRate)
            .put("p01_presence", p01Presence)
            .put("p10_win_rate", p10WinRate)
            .put("p10_presence", p10Presence)
            .put("p35_win_rate", p35WinRate)
            .put("p35_presence", p35Presence)
            .put("p50_win_rate", p50WinRate)
            .put("p50_presence", p50Presence)
            .put("p100_win_rate", p100WinRate)
            .put("p100_presence", p100Presence);
    }
}
