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
