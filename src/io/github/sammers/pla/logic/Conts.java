package io.github.sammers.pla.logic;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

public class Conts {

    public static Pattern SPACE = Pattern.compile(" +");
    public static Pattern TIRE = Pattern.compile("'");
    public static String EU = "en-gb";
    public static String US = "en-us";
    public static String TWO_V_TWO = "2v2";
    public static String THREE_V_THREE = "3v3";
    public static String RBG = "battlegrounds";
    public static String SHUFFLE = "shuffle";
    public static String MULTICLASSERS = "multiclassers";

    public static List<String> BRACKETS = List.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE);

    public static final List<String> shuffleSpecs = new ArrayList<>() {{
        add("shuffle/deathknight/blood");
        add("shuffle/deathknight/frost");
        add("shuffle/deathknight/unholy");
        add("shuffle/demonhunter/havoc");
        add("shuffle/demonhunter/vengeance");
        add("shuffle/druid/balance");
        add("shuffle/druid/feral");
        add("shuffle/druid/guardian");
        add("shuffle/druid/restoration");
        add("shuffle/evoker/devastation");
        add("shuffle/evoker/preservation");
        add("shuffle/evoker/augmentation");
        add("shuffle/hunter/beastmastery");
        add("shuffle/hunter/marksmanship");
        add("shuffle/hunter/survival");
        add("shuffle/mage/arcane");
        add("shuffle/mage/fire");
        add("shuffle/mage/frost");
        add("shuffle/monk/brewmaster");
        add("shuffle/monk/mistweaver");
        add("shuffle/monk/windwalker");
        add("shuffle/paladin/holy");
        add("shuffle/paladin/protection");
        add("shuffle/paladin/retribution");
        add("shuffle/priest/discipline");
        add("shuffle/priest/holy");
        add("shuffle/priest/shadow");
        add("shuffle/rogue/assassination");
        add("shuffle/rogue/outlaw");
        add("shuffle/rogue/subtlety");
        add("shuffle/shaman/elemental");
        add("shuffle/shaman/enhancement");
        add("shuffle/shaman/restoration");
        add("shuffle/warlock/affliction");
        add("shuffle/warlock/demonology");
        add("shuffle/warlock/destruction");
        add("shuffle/warrior/arms");
        add("shuffle/warrior/fury");
        add("shuffle/warrior/protection");
    }};

    public static Map<String, String> SHUFFLE_SPEC_TO_SPEC = new HashMap<>() {
        {
            put("shuffle/deathknight/blood", "Blood Death Knight");
            put("shuffle/deathknight/frost", "Frost Death Knight");
            put("shuffle/deathknight/unholy", "Unholy Death Knight");
            put("shuffle/demonhunter/havoc", "Havoc Demon Hunter");
            put("shuffle/demonhunter/vengeance", "Vengeance Demon Hunter");
            put("shuffle/druid/balance", "Balance Druid");
            put("shuffle/druid/feral", "Feral Druid");
            put("shuffle/druid/guardian", "Guardian Druid");
            put("shuffle/druid/restoration", "Restoration Druid");
            put("shuffle/evoker/devastation", "Devastation Evoker");
            put("shuffle/evoker/preservation", "Preservation Evoker");
            put("shuffle/evoker/augmentation", "Augmentation Evoker");
            put("shuffle/hunter/beastmastery", "Beast Mastery Hunter");
            put("shuffle/hunter/marksmanship", "Marksmanship Hunter");
            put("shuffle/hunter/survival", "Survival Hunter");
            put("shuffle/mage/arcane", "Arcane Mage");
            put("shuffle/mage/fire", "Fire Mage");
            put("shuffle/mage/frost", "Frost Mage");
            put("shuffle/monk/brewmaster", "Brewmaster Monk");
            put("shuffle/monk/mistweaver", "Mistweaver Monk");
            put("shuffle/monk/windwalker", "Windwalker Monk");
            put("shuffle/paladin/holy", "Holy Paladin");
            put("shuffle/paladin/protection", "Protection Paladin");
            put("shuffle/paladin/retribution", "Retribution Paladin");
            put("shuffle/priest/discipline", "Discipline Priest");
            put("shuffle/priest/holy", "Holy Priest");
            put("shuffle/priest/shadow", "Shadow Priest");
            put("shuffle/rogue/assassination", "Assassination Rogue");
            put("shuffle/rogue/outlaw", "Outlaw Rogue");
            put("shuffle/rogue/subtlety", "Subtlety Rogue");
            put("shuffle/shaman/elemental", "Elemental Shaman");
            put("shuffle/shaman/enhancement", "Enhancement Shaman");
            put("shuffle/shaman/restoration", "Restoration Shaman");
            put("shuffle/warlock/affliction", "Affliction Warlock");
            put("shuffle/warlock/demonology", "Demonology Warlock");
            put("shuffle/warlock/destruction", "Destruction Warlock");
            put("shuffle/warrior/arms", "Arms Warrior");
            put("shuffle/warrior/fury", "Fury Warrior");
            put("shuffle/warrior/protection", "Protection Warrior");
        }
    };
}
