const baseUrl = '';

module.exports = {
  urls: {
    statistic: {
      activity: (name) => `/api/activity/${name}`,
    },
  },

  publicUrls: {
    page: '/:region/:activity/:name',
    // base: '/:region',
    // statistic: '/:activity/:name',
  },

  baseUrl,
};
