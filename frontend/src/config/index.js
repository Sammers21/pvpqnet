const baseUrl = process.env.REACT_APP_BASE_API_URL;

module.exports = {
  urls: {
    getData: (page, region, activity, discipline) =>
      `/api/${region}/${activity}/${discipline}?page=${page}`,
  },

  publicUrls: {
    page: '/:region/:activity/:discipline',
  },

  baseUrl,
};
