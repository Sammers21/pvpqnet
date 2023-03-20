export const TABS = {
  activity: 'Activity',
  ladder: 'Ladder',
};

export const TABS_MENU = {
  [TABS.activity]: [
    {
      label: 'SHUFFLE',
      urlOptions: { name: 'shuffle', activity: 'activity' },
    },
    {
      label: '2v2',
      urlOptions: { name: '2v2', activity: 'activity' },
    },
    {
      label: '3v3',
      urlOptions: { name: '3v3', activity: 'activity' },
    },
    {
      label: 'RBG',
      urlOptions: { name: 'rbg', activity: 'activity' },
    },
  ],
  [TABS.ladder]: [
    {
      label: 'SHUFFLE',
      urlOptions: { name: 'shuffle', activity: 'ladder' },
    },
    {
      label: '2v2',
      urlOptions: { name: '2v2', activity: 'ladder' },
    },
    {
      label: '3v3',
      urlOptions: { name: '3v3', activity: 'ladder' },
    },
    {
      label: 'RBG',
      urlOptions: { name: 'rbg', activity: 'ladder' },
    },
  ],
};
