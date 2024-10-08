package io.github.sammers.pla.logic;

import java.util.*;
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
    public static String BLITZ = "blitz";
    public static String MULTICLASSERS = "multiclassers";

    public static Set<String> BRACKETS = Set.of(TWO_V_TWO, THREE_V_THREE, RBG, SHUFFLE, BLITZ);

    public static Set<String> ZOLO_BRACKETS = Set.of(SHUFFLE, BLITZ);

    public static List<String> zoloSpecList(String bracket) {
        return new ArrayList<>() {{
            add(bracket + "/deathknight/blood");
            add(bracket + "/deathknight/frost");
            add(bracket + "/deathknight/unholy");
            add(bracket + "/demonhunter/havoc");
            add(bracket + "/demonhunter/vengeance");
            add(bracket + "/druid/balance");
            add(bracket + "/druid/feral");
            add(bracket + "/druid/guardian");
            add(bracket + "/druid/restoration");
            add(bracket + "/evoker/devastation");
            add(bracket + "/evoker/preservation");
            add(bracket + "/evoker/augmentation");
            add(bracket + "/hunter/beastmastery");
            add(bracket + "/hunter/marksmanship");
            add(bracket + "/hunter/survival");
            add(bracket + "/mage/arcane");
            add(bracket + "/mage/fire");
            add(bracket + "/mage/frost");
            add(bracket + "/monk/brewmaster");
            add(bracket + "/monk/mistweaver");
            add(bracket + "/monk/windwalker");
            add(bracket + "/paladin/holy");
            add(bracket + "/paladin/protection");
            add(bracket + "/paladin/retribution");
            add(bracket + "/priest/discipline");
            add(bracket + "/priest/holy");
            add(bracket + "/priest/shadow");
            add(bracket + "/rogue/assassination");
            add(bracket + "/rogue/outlaw");
            add(bracket + "/rogue/subtlety");
            add(bracket + "/shaman/elemental");
            add(bracket + "/shaman/enhancement");
            add(bracket + "/shaman/restoration");
            add(bracket + "/warlock/affliction");
            add(bracket + "/warlock/demonology");
            add(bracket + "/warlock/destruction");
            add(bracket + "/warrior/arms");
            add(bracket + "/warrior/fury");
            add(bracket + "/warrior/protection");
        }};
    }

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
