const WOW_SEASONS = {
    1: {
        "name": "Season 1",
        "title": "Gladiator",
        "start": "2007-01-30",
        "end": "2007-06-19",
        "duration_weeks": 20,
        "expansion": "Burning Crusade",
        "patch": "2.1.2"
    },
    2: {
        "name": "Season 2",
        "title": "Merciless Gladiator",
        "start": "2007-06-20",
        "end": "2007-11-26",
        "duration_weeks": 23,
        "expansion": "Burning Crusade",
        "patch": "2.1.2"
    },
    3: {
        "name": "Season 3",
        "title": "Vengeful Gladiator",
        "start": "2007-11-28",
        "end": "2008-06-23",
        "duration_weeks": 29,
        "expansion": "Burning Crusade",
        "patch": "2.1.2"
    },
    4: {
        "name": "Season 4",
        "title": "Brutal Gladiator",
        "start": "2008-06-24",
        "end": "2008-10-14",
        "duration_weeks": 17,
        "expansion": "Burning Crusade",
        "patch": "2.1.2"
    },
    5: {
        "name": "Season 5",
        "title": "Deadly Gladiator",
        "start": "2008-12-16",
        "end": "2009-04-14",
        "duration_weeks": 17,
        "expansion": "Wrath of the Lich King",
        "patch": "3.1.0"
    },
    6: {
        "name": "Season 6",
        "title": "Furious Gladiator",
        "start": "2009-04-21",
        "end": "2009-08-25",
        "duration_weeks": 18,
        "expansion": "Wrath of the Lich King",
        "patch": "3.1.0"
    },
    7: {
        "name": "Season 7",
        "title": "Relentless Gladiator",
        "start": "2009-09-01",
        "end": "2010-01-19",
        "duration_weeks": 20,
        "expansion": "Wrath of the Lich King",
        "patch": "3.1.0"
    },
    8: {
        "name": "Season 8",
        "title": "Wrathful Gladiator",
        "start": "2010-02-02",
        "end": "2010-10-12",
        "duration_weeks": 37,
        "expansion": "Wrath of the Lich King",
        "patch": "3.3.2"
    },
    9: {
        "name": "Season 9",
        "title": "Vicious Gladiator",
        "start": "2010-12-14",
        "end": "2011-06-28",
        "duration_weeks": 28,
        "expansion": "Cataclysm",
        "patch": "4.0.3"
    },
    10: {
        "name": "Season 10",
        "title": "Ruthless Gladiator",
        "start": "2011-07-05",
        "end": "2011-11-29",
        "duration_weeks": 21,
        "expansion": "Cataclysm",
        "patch": "4.2.0"
    },
    11: {
        "name": "Season 11",
        "title": "Cataclysmic Gladiator",
        "start": "2011-12-06",
        "end": "2012-08-28",
        "duration_weeks": 38,
        "expansion": "Cataclysm",
        "patch": "4.3.0"
    },
    12: {
        "name": "Season 12",
        "title": "Malevolent Gladiator",
        "start": "2012-10-02",
        "end": "2013-03-05",
        "duration_weeks": 22,
        "expansion": "Mists of Pandaria",
        "patch": "5.0.4"
    },
    13: {
        "name": "Season 13",
        "title": "Tyrannical Gladiator",
        "start": "2013-03-12",
        "end": "2013-09-10",
        "duration_weeks": 26,
        "expansion": "Mists of Pandaria",
        "patch": "5.2.0"
    },
    14: {
        "name": "Season 14",
        "title": "Grievous Gladiator",
        "start": "2013-09-17",
        "end": "2014-02-18",
        "duration_weeks": 22,
        "expansion": "Mists of Pandaria",
        "patch": "5.4.0"
    },
    15: {
        "name": "Season 15",
        "title": "Prideful Gladiator",
        "start": "2014-02-25",
        "end": "2014-10-14",
        "duration_weeks": 33,
        "expansion": "Mists of Pandaria",
        "patch": "5.4.7"
    },
    16: {
        "name": "Warlords Season 1",
        "title": "Primal Gladiator: Warlords Season 1",
        "start": "2014-12-02",
        "end": "2015-06-23",
        "duration_weeks": 29,
        "expansion": "Warlords of Draenor",
        "patch": "6.0.3"
    },
    17: {
        "name": "Warlords Season 2",
        "title": "Wild Gladiator: Warlords Season 2",
        "start": "2015-06-30",
        "end": "2015-11-10",
        "duration_weeks": 22,
        "expansion": "Warlords of Draenor",
        "patch": "6.2.0"
    },
    18: {
        "name": "Warlords Season 3",
        "title": "Warmongering Gladiator: Warlords Season 3",
        "start": "2015-11-17",
        "end": "2016-07-19",
        "duration_weeks": 35,
        "expansion": "Warlords of Draenor",
        "patch": "6.2.2"
    },
    19: {
        "name": "Legion Season 1",
        "title": "Vindictive Gladiator: Legion Season 1",
        "start": "2016-09-20",
        "end": "2016-12-13",
        "duration_weeks": 12,
        "expansion": "Legion",
        "patch": "7.0.3"
    },
    20: {
        "name": "Legion Season 2",
        "title": "Fearless Gladiator: Legion Season 2",
        "start": "2016-12-13",
        "end": "2017-03-28",
        "duration_weeks": 15,
        "expansion": "Legion",
        "patch": "7.2.0"
    },
    21: {
        "name": "Legion Season 3",
        "title": "Cruel Gladiator: Legion Season 3",
        "start": "2017-03-28",
        "end": "2017-06-13",
        "duration_weeks": 11,
        "expansion": "Legion",
        "patch": "7.2.0"
    },
    22: {
        "name": "Legion Season 4",
        "title": "Ferocious Gladiator: Legion Season 4",
        "start": "2017-06-13",
        "end": "2017-08-29",
        "duration_weeks": 11,
        "expansion": "Legion",
        "patch": "7.2.5"
    },
    23: {
        "name": "Legion Season 5",
        "title": "Fierce Gladiator: Legion Season 5",
        "start": "2017-08-29",
        "end": "2017-11-28",
        "duration_weeks": 13,
        "expansion": "Legion",
        "patch": "7.3.0"
    },
    24: {
        "name": "Legion Season 6",
        "title": "Dominant Gladiator: Legion Season 6",
        "start": "2017-11-28",
        "end": "2018-03-20",
        "duration_weeks": 16,
        "expansion": "Legion",
        "patch": "7.3.2"
    },
    25: {
        "name": "Legion Season 7",
        "title": "Demonic Gladiator: Legion Season 7",
        "start": "2018-03-20",
        "end": "2018-07-17",
        "duration_weeks": 17,
        "expansion": "Legion",
        "patch": "8.0.1"
    },
    26: {
        "name": "Battle for Azeroth Season 1",
        "title": "Dread Gladiator: Battle for Azeroth Season 1",
        "start": "2018-09-04",
        "end": "2019-01-22",
        "duration_weeks": 20,
        "expansion": "Battle for Azeroth",
        "patch": "8.0.1"
    },
    27: {
        "name": "Battle for Azeroth Season 2",
        "title": "Sinister Gladiator: Battle for Azeroth Season 2",
        "start": "2019-01-22",
        "end": "2019-06-25",
        "duration_weeks": 22,
        "expansion": "Battle for Azeroth",
        "patch": "8.1.0"
    },
    28: {
        "name": "Battle for Azeroth Season 3",
        "title": "Notorious Gladiator: Battle for Azeroth Season 3",
        "start": "2019-07-09",
        "end": "2020-01-14",
        "duration_weeks": 27,
        "expansion": "Battle for Azeroth",
        "patch": "8.2.0"
    },
    29: {
        "name": "Battle for Azeroth Season 4",
        "title": "Corrupted Gladiator: Battle for Azeroth Season 4",
        "start": "2020-01-21",
        "end": "2020-10-13",
        "duration_weeks": 38,
        "expansion": "Battle for Azeroth",
        "patch": "8.3.0"
    },
    30: {
        "name": "Shadowlands Season 1",
        "title": "Sinful Gladiator: Shadowlands Season 1",
        "start": "2020-12-08",
        "end": "2021-06-28",
        "duration_weeks": 28,
        "expansion": "Shadowlands",
        "patch": "9.0.2"
    },
    31: {
        "name": "Shadowlands Season 2",
        "title": "Unchained Gladiator: Shadowlands Season 2",
        "start": "2021-07-06",
        "end": "2022-02-21",
        "duration_weeks": 32,
        "expansion": "Shadowlands",
        "patch": "9.1.0"
    },
    32: {
        "name": "Shadowlands Season 3",
        "title": "Cosmic Gladiator: Shadowlands Season 3",
        "start": "2022-03-01",
        "end": "2022-08-01",
        "duration_weeks": 22,
        "expansion": "Shadowlands",
        "patch": "9.2.0"
    },
    33: {
        "name": "Shadowlands Season 4",
        "title": "Eternal Gladiator: Shadowlands Season 4",
        "start": "2022-08-02",
        "end": "2022-10-25",
        "duration_weeks": 12,
        "expansion": "Shadowlands",
        "patch": "10.0.0"
    },
    34: {
        "name": "Dragonflight Season 1",
        "title": "Crimson Gladiator: Dragonflight Season 1",
        "start": "2022-12-13",
        "end": "2023-05-01",
        "duration_weeks": 20,
        "expansion": "Dragonflight",
        "patch": "10.1.0"
    },
    35: {
        "name": "Dragonflight Season 2",
        "title": "Obsidian Gladiator: Dragonflight Season 2",
        "start": "2023-05-09",
        "end": "2023-11-08",
        "duration_weeks": 26,
        "expansion": "Dragonflight",
        "patch": "10.2.0"
    },
    36: {
        "name": "Dragonflight Season 3",
        "title": "Verdant Gladiator: Dragonflight Season 3",
        "start": "2023-11-20",
        "end": "TBD",
        "duration_weeks": 20,
        "expansion": "Dragonflight",
        "patch": "10.3.0"
    }
}
