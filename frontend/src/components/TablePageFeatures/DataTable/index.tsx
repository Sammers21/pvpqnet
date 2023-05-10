import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import Table from '../../common/Table';

import useColumns from './useColumns';
import { getData as fetchData } from '../../../services/data.service';

import { REGION, BRACKET } from '../../../constants';

const DataList = () => {
  const { region = REGION.eu, activity = 'activity', bracket = BRACKET.shuffle } = useParams();

  let [searchParams] = useSearchParams();
  var initSpecs: any[] = [];

  if (searchParams.get('specs') != null) {
    initSpecs = searchParams?.get('specs')?.split(',') || [];
  }
  const [contractors, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [specs, setSpecs] = useState(initSpecs);

  const handlePageChange = (_: unknown, value: number) => {
    setPage(value);
  };

  const getDataFilter = useCallback(() => {
    return { page, region, activity, bracket, specs };
  }, [page, region, activity, bracket, specs]);

  const getData = async () => {
    setLoading(true);

    const filter = getDataFilter();
    const { records, totalPages } = await fetchData(filter as any);

    setData(records);
    setTotalPages(totalPages);
    setLoading(false);
  };

  useEffect(() => {
    setPage(1);
  }, [region, activity, bracket]);

  useEffect(() => {
    getData();
  }, [page, region, activity, bracket, specs]);

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
      onSpecsChange={setSpecs}
    />
  );
};

export default DataList;
