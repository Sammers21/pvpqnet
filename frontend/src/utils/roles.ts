export const TANK_SPECS = [
    'Protection Warrior',
    'Protection Paladin',
    'Guardian Druid',
    'Brewmaster Monk',
    'Vengeance Demon Hunter'
];

export const HEAL_SPECS = [
    'Holy Paladin',
    'Restoration Druid',
    'Restoration Shaman',
    'Mistweaver Monk',
    'Holy Priest',
    'Discipline Priest',
    'Preservation Evoker'
];

export const MELEE_SPECS = [
    'Arms Warrior',
    'Fury Warrior',
    'Retribution Paladin',
    'Feral Druid',
    'Windwalker Monk',
    'Havoc Demon Hunter',
    'Assassination Rogue',
    'Outlaw Rogue',
    'Subtlety Rogue',
    'Enhancement Shaman',
    'Unholy Death Knight',
    'Frost Death Knight',
    'Survival Hunter'
];

export const RANGED_SPECS = [
    'Balance Druid',
    'Beast Mastery Hunter',
    'Marksmanship Hunter',
    'Arcane Mage',
    'Fire Mage',
    'Frost Mage',
    'Shadow Priest',
    'Elemental Shaman',
    'Affliction Warlock',
    'Demonology Warlock',
    'Destruction Warlock',
    'Devastation Evoker',
    'Augmentation Evoker'
];

export const DPS_SPECS = [...RANGED_SPECS, ...MELEE_SPECS];
export const ALL_SPECS = [...DPS_SPECS, ...HEAL_SPECS, ...TANK_SPECS];
