import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import Table from '../Table';

import useColumns from './useColumns';
import { getStatistic } from '../../services/stats.service';
import { REGIONS } from '../../constants/region';
import { DISCIPLINES } from '../../constants/pvp-activity';

const DataList = () => {
  const {
    region = REGIONS.eu,
    activity = 'activity',
    discipline = DISCIPLINES.shuffle,
  } = useParams();

  const [contractors, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getDataFilter = useCallback(() => {
    return { page, region, activity, discipline };
  }, [page, region, activity, discipline]);

  const getData = async () => {
    setLoading(true);

    const filter = getDataFilter();
    const { records, totalPages } = await getStatistic(filter);

    setData(records);
    setTotalPages(totalPages);
    setLoading(false);
  };

  useEffect(() => {
    getData();
  }, [page, region, activity, discipline]);

  const columns = useColumns();

  return (
    <Table
      loading={loading}
      totalPages={totalPages}
      columns={columns}
      records={contractors}
      pagination
      page={page}
      onPageChange={handlePageChange}
    />
  );
};

export default DataList;
