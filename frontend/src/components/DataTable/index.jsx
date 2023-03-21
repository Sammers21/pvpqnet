import React, { useState, useEffect, useCallback } from 'react';

import Table from '../Table';

import useColumns from './useColumns';
import { getStatistic } from '../../services/stats.service';

const DataList = () => {
  const [contractors, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getDataFilter = useCallback(() => {
    const pagination = { page, pageSize: 100 };

    return { pagination };
  }, [page]);

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
  }, [page]);

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
