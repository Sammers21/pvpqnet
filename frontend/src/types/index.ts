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

export interface Achievement {
  id: number;
  name: string;
  completed_timestamp: number;
}

interface PlayerAchievements {
  achievements: Achievement[];
  titles_history: TitleHistory;
}

export type Alt = Exclude<Player, 'alts'>;

export interface PlayerMulticlassStanding {
  role: string;
  rank: number;
  score: number;
}

// Equipment Types
export interface EquippedItemEnchantment {
  enchantmentId: number;
  displayString: string;
}

export interface EquippedItemSocket {
  socketType: string;
  gemId?: number;
  icon?: string;
}

export interface EquippedItemSetInfo {
  setId: number;
  displayString: string;
  equippedCount: number;
}

export interface EquippedItemStat {
  type: string;
  value: number;
}

export interface EquippedItem {
  itemId: number;
  slot: string;
  name: string;
  quality: string;
  itemLevel: number;
  bonusList: number[];
  enchantments: EquippedItemEnchantment[];
  sockets: EquippedItemSocket[];
  setInfo?: EquippedItemSetInfo;
  stats: EquippedItemStat[];
  tooltip?: string;
  icon?: string;
}

// PvP Talent Types
export interface PvpTalent {
  talentId: number;
  name: string;
  spellId: number;
  description: string;
  castTime: string;
  slotNumber: number;
}

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
  level?: number;
  media?: CharacterMedia;
  achievements: PlayerAchievements;
  alts?: Alt[];
  multiclassers?: PlayerMulticlassStanding[];
  pvpTalents?: PvpTalent[];
  loadouts?: { name: string; code: string; isActive: boolean }[];

  SHUFFLE?: number;
  ARENA_2v2?: number;
  ARENA_3v3?: number;
  BATTLEGROUNDS?: number;
}
