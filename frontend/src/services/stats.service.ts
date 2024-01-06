import axios from 'axios';

import { BRACKETS } from '@/constants/pvp-activity';
import { REGION } from '@/constants/region';

import { urls } from '@/config';
import type { IMeta } from '@/types';

export const statsMap = {
  [REGION.us]: 'en-us',
  [REGION.eu]: 'en-gb',
};

export const getLadder = async ({
  page = 1,
  region = REGION.eu,
  activity = 'activity',
  bracket = BRACKETS.shuffle,
  specs = [],
}) => {
  try {
    const response = await axios.get(
      urls.getLadderData(page, statsMap[region], activity, bracket, specs), {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    }
    );

    const data = response.data;
    return { records: data?.characters ?? [], totalPages: data?.total_pages ?? 0 };
  } catch (error) {
    return { records: [], totalPages: 0 };
  }
};

export async function getMulticlasserLeaderboard(region: REGION, role: string = 'all', page = 1) {
  try {
    const response = await axios.get(urls.getMulticlasserLeaderboard(statsMap[region]), {
      params: {
        role: role,
        page: page,
      },
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    return response.data;
  } catch (error) {
    return [];
  }
}

export async function fetchStatistic(region: REGION) {
  try {
    const response = await axios.get(urls.getStatistic(statsMap[region]), {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    return response.data;
  } catch (error) {
    return { '2v2': 0, '3v3': 0, rbg: 0, shuffle: 0 };
  }
}

export async function searchPlayers(search: string) {
  try {
    const response = await axios.get(urls.searchPlayers(search), {
      headers: {
        'Accept-Encoding': 'gzip',
      },
    });
    return response.data;
  } catch (error) {
    return [];
  }
}

export async function getMeta(params: Record<string, string>): Promise<IMeta> {
  const response = await axios.get(urls.currentMeta, Object.assign({}, { params }, {
    headers: {
      'Accept-Encoding': 'gzip',
    },
  }
  ));
  return response.data;
}
