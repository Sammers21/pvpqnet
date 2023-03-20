const baseUrl = '';

module.exports = {
  urls: {
    statistic: {
      activity: (name) => `/api/activity/${name}`,
    },
  },

  publicUrls: {
    base: '/:lang',
    statistic: '/:activity/:name',
  },

  baseUrl,
};
