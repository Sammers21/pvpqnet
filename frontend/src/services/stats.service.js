import request from './request.service';

export const getStatistic = async () => {
  try {
    const response = await request('https://pvpq.net/api/en-gb/activity/shuffle?page=1', {
      method: 'GET',
    });
    const data = JSON.parse(response.body);

    return data?.characters ?? [];
  } catch (error) {
    return null;
  }
};
