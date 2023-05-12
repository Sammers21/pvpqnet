import type { ACTIVITY, BRACKET } from '../constants';
import type { TABS } from '../constants/pageHeader';

export interface ITabMenuUrlOption {
  bracket: BRACKET;
  activity: ACTIVITY;
}

export interface ITabMenuOption {
  label: string;
  urlOptions: ITabMenuUrlOption;
}

export type TTabMenu = Record<TABS, ITabMenuOption[]>;

export interface ICrestAndSpec {
  crestId: number;
  specs: string[];
}

export interface IActivityRequest {
  page: number;
  region: string;
  activity: string;
  bracket: string;
  selectedSpecs: string[];
}

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
  last_seen: string;
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
