interface IAcitivityCharacter {
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

interface IActivityDiff {
  won: number;
  lost: number;
  rating_diff: number;
  rank_diff: number;
  last_seen?: string;
}

export interface IActivityRecord extends IAcitivityCharacter {
  character: IAcitivityCharacter;
  diff: IActivityDiff;
}

export interface ITableColumn {
  field: string;
  label: string;
  align?: 'right' | 'left';
  sortable?: boolean;
  width?: -1 | number;
  render: (record: any) => JSX.Element;
}

export interface IMetaSpec {
  '0.050_presence': number;
  '0.050_win_rate': number;
  '0.100_presence': number;
  '0.100_win_rate': number;
  '0.850_presence': number;
  '0.850_win_rate': number;
  spec_name: string;
}

export interface IMetaSpecSizing {
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

export interface IMeta {
  specs: IMetaSpec[];
  specs_sizing?: IMetaSpecSizing;
}

interface IPlayerMedia {
  avatar: string;
  insert: string;
  main_raw: string;
}

export interface IPlayerBracket {
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
  gaming_history: IGamingHistory;
}

export interface IGamingHistory {
  history: IGamingHistoryEntry[];
}

export interface IGamingHistoryEntry {
  diff: IDiff;
  with_who: any[];
  rating?: number;
  rank?: number;
  character: any;
}

export interface IHistoryRow {
  bracket_type: string;
  RANK: IGamingHistoryEntry;
  WL: IDiff;
  RATING: IGamingHistoryEntry;
  WWHO: Array<string>;
  timestamp: number;
}

export interface IDiff {
  won: number;
  lost: number;
  rating_diff: number;
  rank_diff: number;
  timestamp: number;
  last_seen?: string;
}

interface ISeasons {
  name: string;
  highest_achievement: { id: number; name: string; completed_timestamp: number };
  rank: string;
}

export interface IExpansion {
  name: string;
  seasons: ISeasons[];
}

interface ITitleHistory {
  expansions: IExpansion[];
}

interface IPlayerAchievements {
  titles_history: ITitleHistory;
}

export type IAlt = Exclude<IPlayer, 'alts'>;

export interface IPlayer {
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

  brackets?: IPlayerBracket[];
  media?: IPlayerMedia;
  achievements: IPlayerAchievements;
  alts?: IAlt[];

  SHUFFLE?: number;
  ARENA_2v2?: number;
  ARENA_3v3?: number;
  BATTLEGROUNDS?: number;
}
