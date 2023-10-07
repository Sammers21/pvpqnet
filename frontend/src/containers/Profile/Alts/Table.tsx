import { useMemo, useState } from 'react';
import { Table as TableMui, TableBody, TableContainer, TableHead, TableRow } from '@mui/material';
import { styled } from '@mui/system';

import HeaderCell from '../../../components/common/Table/SortableHeaderCell';
import Row from '../../../components/common/Table/Row';

import { IPlayer, ITableColumn } from '../../../types';

const Table = styled(TableMui)({
  width: '100%',
  tableLayout: 'auto',
  '& tbody tr:hover': {
    backgroundColor: 'rgb(21, 128, 61, 0.25)',
  },
  '& tr td,th': {
    borderBottom: 'none',
  },
});

interface IProps {
  columns: ITableColumn[];
  records: IPlayer[];
  isMobile: boolean;
}

const AltsTable = ({ columns, records = [], isMobile }: IProps) => {
  const [sort, setSort] = useState<{ field: keyof IPlayer; sort: 'asc' | 'desc' }>({
    field: 'SHUFFLE',
    sort: 'desc',
  });

  const rowsComponent = useMemo(() => {
    function renderRow(record: IPlayer, index: number) {
      return <Row key={index} record={record} columns={columns} />;
    }

    function sortRecords(records: IPlayer[], sort: { field: keyof IPlayer; sort: 'asc' | 'desc' }) {
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
      <HeaderCell key={index} column={column} sort={sort} onSort={onSort} />
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
    <Table padding={isMobile ? 'none' : 'normal'}>
      {renderHeader()}
      <colgroup>
        {columns.map((_col, index) => (
          <col key={index} />
        ))}
      </colgroup>
      {records.length ? renderBody() : null}
    </Table>
  );

  return <TableContainer>{renderTable()}</TableContainer>;
};

export default AltsTable;
