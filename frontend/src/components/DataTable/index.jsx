import React, {useCallback, useEffect, useState} from 'react';
import {useParams, useSearchParams} from 'react-router-dom';

import Table from '../Table';

import useColumns from './useColumns';
import {getStatistic} from '../../services/stats.service';
import {REGIONS} from '../../constants/region';
import {DISCIPLINES} from '../../constants/pvp-activity';

const DataList = () => {
  const {
    region = REGIONS.eu,
    activity = 'activity',
    discipline = DISCIPLINES.shuffle,
  } = useParams();

  let [searchParams, setSearchParams] = useSearchParams();
  var specs = []
  if (searchParams.get('specs') != null){
    specs = searchParams.get('specs').split(',');
  }
  const [contractors, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const getDataFilter = useCallback(() => {
    return {page, region, activity, discipline, specs};
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
    setPage(1);
  }, [region, activity, discipline]);

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
