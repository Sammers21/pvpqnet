import React, { useState, useEffect, useCallback } from 'react';

import Table from '../Table';

import useColumns from './useColumns';
import { getStatistic } from '../../services/stats.service';

const ContractorsList = () => {
  const [contractors, setContractors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const handlePageChange = (page) => {
    setPage(page);
  };

  const getContractorsFilter = useCallback(() => {
    const pagination = { page, pageSize: 10 };

    return { pagination };
  }, [page]);

  const getContractors = async () => {
    setLoading(true);

    const filter = getContractorsFilter();
    const result = await getStatistic(filter);

    setContractors(result);
    setTotalCount(1001);
    setLoading(false);
  };

  useEffect(() => {
    getContractors();
  }, [page]);

  const columns = useColumns();

  return (
    <Table
      loading={loading}
      itemsCount={totalCount}
      columns={columns}
      records={contractors}
      pagination
      page={page}
      onPageChange={handlePageChange}
    />
  );
};

export default ContractorsList;
