import type { TFilterName, IMetaFilter } from '@/containers/Meta/types';

export const columnGroups = [
  { field: '0.850', icons: ['rank_2.png', 'rank_4.png', 'rank_6.png'] },
  { field: '0.100', icons: ['rank_7.png', 'rank_8.png'] },
  { field: '0.050', icons: ['rank_9.png', 'rank_10.png'] },
];

export const metaFilter: IMetaFilter[] = [
  {
    title: 'Bracket',
    name: 'bracket',
    options: ['Shuffle', '2v2', '3v3', 'Battlegrounds', 'Blitz'],
  },
  {
    title: 'Period',
    name: 'period',
    options: ['Last month', 'Last week', 'Last day', 'This season'],
  },
  {
    title: 'Role',
    name: 'role',
    options: ['All', 'Melee', 'Ranged', 'Dps', 'Healer', 'Tank'],
  },
];

export const defaultFilters: Record<TFilterName, string> = {
  bracket: 'Shuffle',
  period: 'This season',
  role: 'All',
};
