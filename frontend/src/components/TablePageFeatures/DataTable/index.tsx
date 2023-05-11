import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import Table from '../../common/Table';
import TableFilter from '../../TableFilter';

import useColumns from './useColumns';
import { getData as fetchData } from '../../../services/data.service';

import { REGION, BRACKET, ACTIVITY } from '../../../constants';
import { getFromSearchParams } from '../../../utils/getFromSearchParams';

const DataList = () => {
  const {
    region = REGION.eu,
    activity = ACTIVITY.activity,
    bracket = BRACKET.shuffle,
  } = useParams();
  const [searchParams] = useSearchParams();

  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState(getFromSearchParams(searchParams, 'specs'));

  const handlePageChange = (_: unknown, value: number) => {
    setPage(value);
  };

  const getDataFilter = useCallback(() => {
    return { page, region, activity, bracket, selectedSpecs };
  }, [page, region, activity, bracket, selectedSpecs]);

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
  }, [page, region, activity, bracket, selectedSpecs]);

  const columns = useColumns();

  return (
    <>
      <TableFilter selectedSpecs={selectedSpecs} onSpecsChange={setSelectedSpecs} />

      <Table
        loading={loading}
        totalPages={totalPages}
        columns={columns}
        records={data}
        pagination
        page={page}
        onPageChange={handlePageChange}
      />
    </>
  );
};

export default DataList;
