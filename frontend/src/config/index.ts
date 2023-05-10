import type { BRACKET, BACKEND_REGION, ACTIVITY } from '../constants';

export const baseUrl = import.meta.env.VITE_BASE_API_URL;

export const urls = {
  getActivity: ({
    page,
    region,
    activity,
    bracket,
    specs,
  }: {
    page: number;
    region: BACKEND_REGION;
    activity: ACTIVITY;
    bracket: BRACKET;
    specs: unknown[];
  }) => {
    return `/api/${region}/${activity}/${bracket}?page=${page}&specs=${specs.join(',')}`;
  },
};

export const publicUrls = {
  activity: '/:region/:activity/:bracket',
};
