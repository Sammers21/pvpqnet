import { BRACKET, ACTIVITY } from '.';
import type { TTabMenu } from '../types';

export enum TABS {
  activity = 'Activity',
  ladder = 'Ladder',
}

export const TABS_MENU: TTabMenu = {
  [TABS.activity]: [
    {
      label: 'SHUFFLE',
      urlOptions: { bracket: BRACKET.shuffle, activity: ACTIVITY.activity },
    },
    {
      label: '2v2',
      urlOptions: { bracket: BRACKET['2v2'], activity: ACTIVITY.activity },
    },
    {
      label: '3v3',
      urlOptions: { bracket: BRACKET['3v3'], activity: ACTIVITY.activity },
    },
    {
      label: 'RBG',
      urlOptions: { bracket: BRACKET.rbg, activity: ACTIVITY.activity },
    },
  ],
  [TABS.ladder]: [
    {
      label: 'SHUFFLE',
      urlOptions: { bracket: BRACKET.shuffle, activity: ACTIVITY.ladder },
    },
    {
      label: '2v2',
      urlOptions: { bracket: BRACKET['2v2'], activity: ACTIVITY.ladder },
    },
    {
      label: '3v3',
      urlOptions: { bracket: BRACKET['3v3'], activity: ACTIVITY.ladder },
    },
    {
      label: 'RBG',
      urlOptions: { bracket: BRACKET.rbg, activity: ACTIVITY.ladder },
    },
  ],
};
