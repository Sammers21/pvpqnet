import request from './request.service';

export const getStatistic = async () => {
  try {
    const response = await request('https://pvpq.net/api/en-gb/activity/shuffle?page=1', {
      method: 'GET',
    });
    const data = JSON.parse(response.body);

    return { records: data?.characters ?? [], totalPages: data?.total_pages ?? 0 };
  } catch (error) {
    return null;
  }
};
