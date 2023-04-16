export const TABS = {
  activity: 'Activity',
  ladder: 'Ladder',
};

export const TABS_MENU = {
  [TABS.activity]: [
    {
      label: 'SHUFFLE',
      urlOptions: { bracket: 'shuffle', activity: 'activity' },
    },
    {
      label: '2v2',
      urlOptions: { bracket: '2v2', activity: 'activity' },
    },
    {
      label: '3v3',
      urlOptions: { bracket: '3v3', activity: 'activity' },
    },
    {
      label: 'RBG',
      urlOptions: { bracket: 'rbg', activity: 'activity' },
    },
  ],
  [TABS.ladder]: [
    {
      label: 'SHUFFLE',
      urlOptions: { bracket: 'shuffle', activity: 'ladder' },
    },
    {
      label: '2v2',
      urlOptions: { bracket: '2v2', activity: 'ladder' },
    },
    {
      label: '3v3',
      urlOptions: { bracket: '3v3', activity: 'ladder' },
    },
    {
      label: 'RBG',
      urlOptions: { bracket: 'rbg', activity: 'ladder' },
    },
  ],
};
