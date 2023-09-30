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
  render: ({ record }: { record: IActivityRecord }) => JSX.Element;
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
  alts?: IPlayer[];
}
