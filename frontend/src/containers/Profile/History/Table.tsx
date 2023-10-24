import { useMemo, useState } from 'react';
import { Table as TableMui, TableBody, TableContainer, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/system';

import HeaderCell from '@/components/common/Table/SortableHeaderCell';
import Row from '@/components/common/Table/Row';

import type { IHistoryRow, ITableColumn } from '@/types';
import bgImage from '../../../assets/background/smoke-table.jpg';

const Table = styled(TableMui)({
  width: '100%',
  tableLayout: 'auto',

  '& tbody': {
    backgroundImage: `url(${bgImage})`,
  },
  '& tr': {
    height: '40px !important',
  },
  '& th, td': {
    padding: '4px !important',
  },
  '& tr td,th': {
    borderBottom: 'none',
  },
});

interface IProps {
  columns: ITableColumn[];
  records: IHistoryRow[];
  isMobile: boolean;
}

const HistoryTable = ({ columns, records = [], isMobile }: IProps) => {
  const [sort, setSort] = useState<{ field: keyof IHistoryRow; sort: 'asc' | 'desc' }>({
    field: 'timestamp',
    sort: 'desc',
  });

  const rowsComponent = useMemo(() => {
    function renderRow(record: IHistoryRow, index: number) {
      function getRowColor(): string {
        if (record.RATING.diff.rating_diff === 0) return '#0c0c0cCC';
        return record.RATING.diff.rating_diff > 0 ? '#172517CC' : '#2b1715CC';
      }

      return <Row key={index} record={record} columns={columns} bgColor={getRowColor()} />;
    }

    function sortRecords(
      records: IHistoryRow[],
      sort: { field: keyof IHistoryRow; sort: 'asc' | 'desc' }
    ) {
      return records.sort((a, b) => {
        if (sort.sort === 'desc') {
          return (a[sort.field] as number) > (b[sort.field] as number) ? -1 : 1;
        }
        return (a[sort.field] as number) > (b[sort.field] as number) ? 1 : -1;
      });
    }

    return sortRecords(records, sort).map((record, index) => renderRow(record, index));
  }, [columns, records, sort]);

  const onSort = (field: any, sort: 'asc' | 'desc') => {
    setSort({ field, sort });
  };

  const renderHeaderCells = () => {
    return columns.map((column, index) => (
      <HeaderCell
        key={index}
        column={column}
        sort={sort}
        onSort={onSort}
        sortable={column.sortable ?? true}
      />
    ));
  };

  const renderHeader = () => {
    return (
      <TableHead>
        <TableRow>{renderHeaderCells()}</TableRow>
      </TableHead>
    );
  };

  const renderBody = () => {
    return <TableBody>{rowsComponent}</TableBody>;
  };

  const renderTable = () => (
    <div className="px-2 md:px-0">
      <Table padding={isMobile ? 'none' : 'normal'}>
        {renderHeader()}
        <colgroup>
          {columns.map((_col, index) => (
            <col key={index} />
          ))}
        </colgroup>
        {records.length ? renderBody() : null}
      </Table>
    </div>
  );

  return (
    <div className="relative bg-[#030303e6]">
      {<TableContainer>{renderTable()}</TableContainer>}
      {!records.length && (
        <div className="min-h-[100px] flex justify-center items-center">
          <span className="text-lg">No history data available</span>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
