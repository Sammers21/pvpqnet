import { urls } from '../config';
import { BRACKETS } from '../constants/pvp-activity';
import { REGIONS } from '../constants/region';
import request from './request.service';

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
    const url = urls.getData(page, statsMap[region], activity, bracket, specs);
    const response = await request(url, { method: 'GET' });
    const data = JSON.parse(response.body);
    return { records: data?.characters ?? [], totalPages: data?.total_pages ?? 0 };
  } catch (error) {
    return null;
  }
};
