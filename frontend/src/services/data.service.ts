import { baseUrl, urls } from '../config';
import { ACTIVITY, BACKEND_REGION, BRACKET, REGION } from '../constants';

import request from './request.service';

export const getData = async ({
  page = 1,
  region = REGION.eu,
  activity = ACTIVITY.activity,
  bracket = BRACKET.shuffle,
  selectedSpecs = [],
}) => {
  try {
    const url = urls.getActivity({
      page,
      region: BACKEND_REGION[region],
      activity,
      bracket,
      selectedSpecs,
    });

    const response = await request(url, { method: 'GET', isJson: true, baseUrl });
    const data = await response.json();

    return { records: data?.characters ?? [], totalPages: data?.total_pages ?? 0 };
  } catch (error) {
    return { records: [], totalPages: 0 };
  }
};

export const fetchStatistic = async (region: REGION) => {
  try {
    const url = urls.getStatistic(BACKEND_REGION[region]);

    const response = await request(url, { method: 'GET', isJson: true, baseUrl });
    const statistic = await response.json();

    return statistic;
  } catch (error) {
    return { records: [], totalPages: 0 };
  }
};
