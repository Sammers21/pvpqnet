import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASE_API_URL;

axios.defaults.baseURL = baseUrl;

const urls = {
  getLadderData: (page: number, region: string, activity: string, bracket: string, specs: string[]) => {
    return `/api/${region}/${activity}/${bracket}?page=${page}&specs=${specs.join(',')}`;
  },
  getMulticlasserLeaderboard: (region: string) => {
    return `/api/${region}/ladder/multiclassers`;
  },
  getStatistic: (region: string) => {
    return `/api/${region}/activity/stats`;
  },
  searchPlayers: (search: string) => {
    return `/api/search?q=${search}`;
  },
  currentMeta: `/api/meta`,
};

const publicUrls = {
  page: '/:region/:activity/:bracket',
};
const metaUrls = {
  page: '/:region/meta',
};

const shuffleMulticlassUrls = {
  page: '/:region/ladder/shuffle-multiclass'
};

export { baseUrl, urls, publicUrls, metaUrls, shuffleMulticlassUrls };
