export interface WowSeason {
  id: number;
  name: string;
  shortName: string;
  expansion: string;
  startDate: string; // ISO date string
  endDate: string | null; // null means current season
}

// All WoW PvP seasons from Season 1 (TBC) to Season 40 (TWW S3)
export const WOW_SEASONS: WowSeason[] = [
  // The War Within
  {
    id: 40,
    name: "The War Within Season 3",
    shortName: "TWW S3",
    expansion: "The War Within",
    startDate: "2025-08-12",
    endDate: null,
  },
  {
    id: 39,
    name: "The War Within Season 2",
    shortName: "TWW S2",
    expansion: "The War Within",
    startDate: "2025-03-04",
    endDate: "2025-08-04",
  },
  {
    id: 38,
    name: "The War Within Season 1",
    shortName: "TWW S1",
    expansion: "The War Within",
    startDate: "2024-09-10",
    endDate: "2025-02-25",
  },
  // Dragonflight
  {
    id: 37,
    name: "Dragonflight Season 4",
    shortName: "DF S4",
    expansion: "Dragonflight",
    startDate: "2024-04-23",
    endDate: "2024-07-22",
  },
  {
    id: 36,
    name: "Dragonflight Season 3",
    shortName: "DF S3",
    expansion: "Dragonflight",
    startDate: "2023-11-14",
    endDate: "2024-04-22",
  },
  {
    id: 35,
    name: "Dragonflight Season 2",
    shortName: "DF S2",
    expansion: "Dragonflight",
    startDate: "2023-05-09",
    endDate: "2023-11-07",
  },
  {
    id: 34,
    name: "Dragonflight Season 1",
    shortName: "DF S1",
    expansion: "Dragonflight",
    startDate: "2022-12-13",
    endDate: "2023-05-01",
  },
  // Shadowlands
  {
    id: 33,
    name: "Shadowlands Season 4",
    shortName: "SL S4",
    expansion: "Shadowlands",
    startDate: "2022-08-02",
    endDate: "2022-10-25",
  },
  {
    id: 32,
    name: "Shadowlands Season 3",
    shortName: "SL S3",
    expansion: "Shadowlands",
    startDate: "2022-03-01",
    endDate: "2022-08-01",
  },
  {
    id: 31,
    name: "Shadowlands Season 2",
    shortName: "SL S2",
    expansion: "Shadowlands",
    startDate: "2021-07-06",
    endDate: "2022-02-21",
  },
  {
    id: 30,
    name: "Shadowlands Season 1",
    shortName: "SL S1",
    expansion: "Shadowlands",
    startDate: "2020-12-08",
    endDate: "2021-06-28",
  },
  // Battle for Azeroth
  {
    id: 29,
    name: "Battle for Azeroth Season 4",
    shortName: "BfA S4",
    expansion: "Battle for Azeroth",
    startDate: "2020-01-21",
    endDate: "2020-10-13",
  },
  {
    id: 28,
    name: "Battle for Azeroth Season 3",
    shortName: "BfA S3",
    expansion: "Battle for Azeroth",
    startDate: "2019-07-09",
    endDate: "2020-01-14",
  },
  {
    id: 27,
    name: "Battle for Azeroth Season 2",
    shortName: "BfA S2",
    expansion: "Battle for Azeroth",
    startDate: "2019-01-22",
    endDate: "2019-06-25",
  },
  {
    id: 26,
    name: "Battle for Azeroth Season 1",
    shortName: "BfA S1",
    expansion: "Battle for Azeroth",
    startDate: "2018-09-04",
    endDate: "2019-01-22",
  },
  // Legion
  {
    id: 25,
    name: "Legion Season 7",
    shortName: "Legion S7",
    expansion: "Legion",
    startDate: "2018-03-20",
    endDate: "2018-07-17",
  },
  {
    id: 24,
    name: "Legion Season 6",
    shortName: "Legion S6",
    expansion: "Legion",
    startDate: "2017-11-28",
    endDate: "2018-03-20",
  },
  {
    id: 23,
    name: "Legion Season 5",
    shortName: "Legion S5",
    expansion: "Legion",
    startDate: "2017-08-29",
    endDate: "2017-11-28",
  },
  {
    id: 22,
    name: "Legion Season 4",
    shortName: "Legion S4",
    expansion: "Legion",
    startDate: "2017-06-13",
    endDate: "2017-08-29",
  },
  {
    id: 21,
    name: "Legion Season 3",
    shortName: "Legion S3",
    expansion: "Legion",
    startDate: "2017-03-28",
    endDate: "2017-06-13",
  },
  {
    id: 20,
    name: "Legion Season 2",
    shortName: "Legion S2",
    expansion: "Legion",
    startDate: "2016-12-13",
    endDate: "2017-03-28",
  },
  {
    id: 19,
    name: "Legion Season 1",
    shortName: "Legion S1",
    expansion: "Legion",
    startDate: "2016-09-20",
    endDate: "2016-12-13",
  },
  // Warlords of Draenor
  {
    id: 18,
    name: "Warlords Season 3",
    shortName: "WoD S3",
    expansion: "Warlords of Draenor",
    startDate: "2015-11-17",
    endDate: "2016-07-19",
  },
  {
    id: 17,
    name: "Warlords Season 2",
    shortName: "WoD S2",
    expansion: "Warlords of Draenor",
    startDate: "2015-06-30",
    endDate: "2015-11-10",
  },
  {
    id: 16,
    name: "Warlords Season 1",
    shortName: "WoD S1",
    expansion: "Warlords of Draenor",
    startDate: "2014-12-02",
    endDate: "2015-06-23",
  },
  // Mists of Pandaria
  {
    id: 15,
    name: "Season 15",
    shortName: "MoP S15",
    expansion: "Mists of Pandaria",
    startDate: "2014-02-25",
    endDate: "2014-10-14",
  },
  {
    id: 14,
    name: "Season 14",
    shortName: "MoP S14",
    expansion: "Mists of Pandaria",
    startDate: "2013-09-17",
    endDate: "2014-02-18",
  },
  {
    id: 13,
    name: "Season 13",
    shortName: "MoP S13",
    expansion: "Mists of Pandaria",
    startDate: "2013-03-12",
    endDate: "2013-09-10",
  },
  {
    id: 12,
    name: "Season 12",
    shortName: "MoP S12",
    expansion: "Mists of Pandaria",
    startDate: "2012-10-02",
    endDate: "2013-03-05",
  },
  // Cataclysm
  {
    id: 11,
    name: "Season 11",
    shortName: "Cata S11",
    expansion: "Cataclysm",
    startDate: "2011-12-06",
    endDate: "2012-08-28",
  },
  {
    id: 10,
    name: "Season 10",
    shortName: "Cata S10",
    expansion: "Cataclysm",
    startDate: "2011-07-05",
    endDate: "2011-11-29",
  },
  {
    id: 9,
    name: "Season 9",
    shortName: "Cata S9",
    expansion: "Cataclysm",
    startDate: "2010-12-14",
    endDate: "2011-06-28",
  },
  // Wrath of the Lich King
  {
    id: 8,
    name: "Season 8",
    shortName: "WotLK S8",
    expansion: "Wrath of the Lich King",
    startDate: "2010-02-02",
    endDate: "2010-10-12",
  },
  {
    id: 7,
    name: "Season 7",
    shortName: "WotLK S7",
    expansion: "Wrath of the Lich King",
    startDate: "2009-09-01",
    endDate: "2010-01-19",
  },
  {
    id: 6,
    name: "Season 6",
    shortName: "WotLK S6",
    expansion: "Wrath of the Lich King",
    startDate: "2009-04-21",
    endDate: "2009-08-25",
  },
  {
    id: 5,
    name: "Season 5",
    shortName: "WotLK S5",
    expansion: "Wrath of the Lich King",
    startDate: "2008-12-16",
    endDate: "2009-04-14",
  },
  // Burning Crusade
  {
    id: 4,
    name: "Season 4",
    shortName: "TBC S4",
    expansion: "Burning Crusade",
    startDate: "2008-06-24",
    endDate: "2008-10-14",
  },
  {
    id: 3,
    name: "Season 3",
    shortName: "TBC S3",
    expansion: "Burning Crusade",
    startDate: "2007-11-28",
    endDate: "2008-06-23",
  },
  {
    id: 2,
    name: "Season 2",
    shortName: "TBC S2",
    expansion: "Burning Crusade",
    startDate: "2007-06-20",
    endDate: "2007-11-26",
  },
  {
    id: 1,
    name: "Season 1",
    shortName: "TBC S1",
    expansion: "Burning Crusade",
    startDate: "2007-01-30",
    endDate: "2007-06-19",
  },
];

// Get the current active season
export const getCurrentSeason = (): WowSeason => {
  return WOW_SEASONS.find((s) => s.endDate === null) || WOW_SEASONS[0];
};

// Get season by ID
export const getSeasonById = (id: number): WowSeason | undefined => {
  return WOW_SEASONS.find((s) => s.id === id);
};

// Check if a timestamp falls within a season
export const isTimestampInSeason = (
  timestamp: number,
  season: WowSeason
): boolean => {
  const date = new Date(timestamp);
  const startDate = new Date(season.startDate);
  const endDate = season.endDate ? new Date(season.endDate) : new Date();
  return date >= startDate && date <= endDate;
};

// Get season for a given timestamp
export const getSeasonForTimestamp = (timestamp: number): WowSeason | null => {
  return (
    WOW_SEASONS.find((season) => isTimestampInSeason(timestamp, season)) || null
  );
};

// Get seasons that have history data (based on timestamps in history)
export const getSeasonsWithHistory = (
  historyTimestamps: number[]
): WowSeason[] => {
  if (historyTimestamps.length === 0) return [getCurrentSeason()];
  const seasonsWithData = new Set<number>();
  // Always include current season
  seasonsWithData.add(getCurrentSeason().id);
  // Find all seasons that have history entries
  historyTimestamps.forEach((timestamp) => {
    const season = getSeasonForTimestamp(timestamp);
    if (season) {
      seasonsWithData.add(season.id);
    }
  });
  return WOW_SEASONS.filter((s) => seasonsWithData.has(s.id));
};
