import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { createBreakpoint } from 'react-use';

import Table from '@/components/AltsTable';
import TableFilter from '@/components/TableFilter';

import getTableColumns from './useColumns';
import { getLadder } from '@/services/stats.service';
import {getActivityFromUrl, getBracket, getRegion} from '@/utils/urlparts';

import { BRACKETS } from '@/constants/pvp-activity';
import type { IActivityRecord } from '@/types';

export function getFromSearchParams(searchParams: URLSearchParams, name: string): string[] {
  return searchParams?.get(name)?.split(',') || [];
}

const useBreakpoint = createBreakpoint({ S: 758, L: 900, XL: 1280 });

interface IProps {
  data: Record<BRACKETS, string> | undefined;
}

const DataList = ({ data: statistics }: IProps) => {
  const { region = getRegion(), bracket = getBracket() } = useParams();
  const activity = getActivityFromUrl();
  const [searchParams] = useSearchParams();
  const breakpoint = useBreakpoint();

  const [data, setData] = useState<IActivityRecord[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedSpecs, setSelectedSpecs] = useState(getFromSearchParams(searchParams, 'specs'));
  const [diff, setDiff] = useState<IActivityRecord | null>(null);

  function handlePageChange(_: unknown, value: number) {
    setPage(value);
  }

  useEffect(() => {
    setPage(1);
  }, [region, activity, bracket]);

  useEffect(() => {
    async function getData() {
      setLoading(true);

      const filter = { page, region, activity, bracket, specs: selectedSpecs };
      const { records, totalPages } = await getLadder(filter as any);

      setData(records);
      setTotalPages(totalPages);
      setLoading(false);
    }

    getData();
  }, [page, region, activity, bracket, selectedSpecs]);

  const getColumns = useCallback(() => {
    return getTableColumns(activity, breakpoint === 'S', region);
  }, [activity, breakpoint, region]);

  return (
    <>
      <TableFilter
        selectedSpecs={selectedSpecs}
        onSpecsChange={setSelectedSpecs}
        bracket={bracket}
        statistics={statistics}
      />
      <Table
        loading={loading}
        totalPages={totalPages}
        columns={getColumns()}
        records={data}
        pagination
        page={page}
        onPageChange={handlePageChange}
        onRowOver={(record) => setDiff(record)}
        diff={diff}
      />
    </>
  );
};

export default DataList;
