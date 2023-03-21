export const TABS = {
  activity: 'Activity',
  ladder: 'Ladder',
};

export const TABS_MENU = {
  [TABS.activity]: [
    {
      label: 'SHUFFLE',
      urlOptions: { discipline: 'shuffle', activity: 'activity' },
    },
    {
      label: '2v2',
      urlOptions: { discipline: '2v2', activity: 'activity' },
    },
    {
      label: '3v3',
      urlOptions: { discipline: '3v3', activity: 'activity' },
    },
    {
      label: 'RBG',
      urlOptions: { discipline: 'rbg', activity: 'activity' },
    },
  ],
  [TABS.ladder]: [
    {
      label: 'SHUFFLE',
      urlOptions: { discipline: 'shuffle', activity: 'ladder' },
    },
    {
      label: '2v2',
      urlOptions: { discipline: '2v2', activity: 'ladder' },
    },
    {
      label: '3v3',
      urlOptions: { discipline: '3v3', activity: 'ladder' },
    },
    {
      label: 'RBG',
      urlOptions: { discipline: 'rbg', activity: 'ladder' },
    },
  ],
};
