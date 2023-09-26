const baseUrl = process.env.REACT_APP_BASE_API_URL;

module.exports = {
  urls: {
    getData: (page, region, activity, bracket, specs) => {
      return `/api/${region}/${activity}/${bracket}?page=${page}&specs=${specs.join(',')}`;
    },
    getStatistic: (region) => {
      return `/api/${region}/activity/stats`;
    },
  },

  publicUrls: {
    page: '/:region/:activity/:bracket',
  },
  metaUrls: {
    page: '/:region/meta',
  },
  baseUrl,
};
