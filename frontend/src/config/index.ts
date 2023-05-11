import type { IActivityRequest } from '../types';

export const baseUrl = import.meta.env.VITE_BASE_API_URL;

export const urls = {
  getActivity: ({ page, region, activity, bracket, selectedSpecs }: IActivityRequest) => {
    return `/api/${region}/${activity}/${bracket}?page=${page}&specs=${selectedSpecs.join(',')}`;
  },
};

export const publicUrls = {
  base: '/',
  activity: '/:region/:activity/:bracket',
};
