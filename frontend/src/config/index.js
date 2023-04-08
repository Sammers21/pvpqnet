const baseUrl = process.env.REACT_APP_BASE_API_URL;

module.exports = {
  urls: {
    getData: (page, region, activity, discipline, specs) => {
      return `/api/${region}/${activity}/${discipline}?page=${page}&specs=${specs.join(',')}`;
    },
  },

  publicUrls: {
    page: '/:region/:activity/:discipline',
  },

  baseUrl,
};
