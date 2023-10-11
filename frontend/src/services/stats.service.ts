import axios from 'axios';

import { BRACKETS } from '@/constants/pvp-activity';
import { REGIONS } from '@/constants/region';

import { urls } from '@/config';
import type { IMeta } from '@/types';

export const statsMap = {
  [REGIONS.us]: 'en-us',
  [REGIONS.eu]: 'en-gb',
};

export const getStatistic = async ({
  page = 1,
  region = REGIONS.eu,
  activity = 'activity',
  bracket = BRACKETS.shuffle,
  specs = [],
}) => {
  try {
    const response = await axios.get(
      urls.getData(page, statsMap[region], activity, bracket, specs)
    );

    const data = response.data;
    return { records: data?.characters ?? [], totalPages: data?.total_pages ?? 0 };
  } catch (error) {
    return { records: [], totalPages: 0 };
  }
};

export async function fetchStatistic(region: REGIONS) {
  try {
    const response = await axios.get(urls.getStatistic(statsMap[region]));
    return response.data;
  } catch (error) {
    return { '2v2': 0, '3v3': 0, rbg: 0, shuffle: 0 };
  }
}

export async function searchPlayers(search: string) {
  try {
    const response = await axios.get(urls.searchPlayers(search));
    return response.data;
  } catch (error) {
    return [];
  }
}

export async function getMeta(params: Record<string, string>): Promise<IMeta> {
  const response = await axios.get(urls.currentMeta, { params });
  return response.data;
}
