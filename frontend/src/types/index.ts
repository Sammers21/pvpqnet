interface Character {
  class: string;
  full_spec: string;
  race: string;
  gender: string;
  pos: number;
  rating: number;
  in_cutoff: boolean;
  name: string;
  fraction: string;
  realm: string;
  wins: number;
  losses: number;
  pethash: number;
}

interface ActivityDiff {
  won: number;
  lost: number;
  rating_diff: number;
  rank_diff: number;
  last_seen?: string;
}

export interface CharacterAndDiff extends Character {
  character: Character;
  diff: ActivityDiff;
}

export interface TableColumn {
  field: string;
  label: string;
  align?: 'right' | 'left' | 'center';
  sortable?: boolean;
  width?: -1 | number;
  render: (record: any) => JSX.Element;
}

export interface MetaSpec {
  '0.050_presence': number;
  '0.050_win_rate': number;
  '0.100_presence': number;
  '0.100_win_rate': number;
  '0.850_presence': number;
  '0.850_win_rate': number;
  spec_name: string;
}

export interface MetaSpecSizing {
  '0.050_max': number;
  '0.050_min': number;
  '0.050_total': number;
  '0.100_max': number;
  '0.100_min': number;
  '0.100_total': number;

  '0.850_max': number;
  '0.850_min': number;
  '0.850_total': number;
}

export interface Meta {
  specs: MetaSpec[];
  specs_sizing?: MetaSpecSizing;
}

interface CharacterMedia {
  avatar: string;
  insert: string;
  main_raw: string;
}

export interface Bracket {
  bracket_type: string;
  rating: number;

  won: number;
  lost: number;
  rank: number;

  is_rank_one_range: boolean;
  season_max_rating: number;
  season_max_rating_achieved_timestamp: number;

  max_rating: number;
  max_rating_achieved_timestamp: number;
  gaming_history: GamingHistory;
}

export interface GamingHistory {
  history: GamingHistoryEntry[];
}

export interface GamingHistoryEntry {
  diff: Diff;
  with_who: any[];
  rating?: number;
  rank?: number;
  character: any;
}

export interface HistoryRow {
  bracket_type: string;
  RANK: GamingHistoryEntry;
  WL: Diff;
  RATING: GamingHistoryEntry;
  WWHO: Array<string>;
  timestamp: number;
}

export interface Diff {
  won: number;
  lost: number;
  rating_diff: number;
  rank_diff: number;
  timestamp: number;
  last_seen?: string;
}

interface Seasons {
  name: string;
  highest_achievement: { id: number; name: string; completed_timestamp: number };
  rank: string;
}

export interface Expansion {
  name: string;
  seasons: Seasons[];
}

interface TitleHistory {
  expansions: Expansion[];
}

interface PlayerAchievements {
  titles_history: TitleHistory;
}

export type Alt = Exclude<Player, 'alts'>;

export interface Player {
  id: number;
  name: string;
  class: string;
  fraction: string;
  realm: string;
  gender: string;
  itemLevel: number;
  lastUpdatedUTCms: number;
  activeSpec: string;
  race: string;
  region: string;
  talents: string;

  brackets?: Bracket[];
  media?: CharacterMedia;
  achievements: PlayerAchievements;
  alts?: Alt[];

  SHUFFLE?: number;
  ARENA_2v2?: number;
  ARENA_3v3?: number;
  BATTLEGROUNDS?: number;
}
