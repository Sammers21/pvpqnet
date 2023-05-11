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
