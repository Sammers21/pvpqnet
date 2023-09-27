import { get } from 'lodash';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { IActivityRecord, ITableColumn } from '../../../types';

interface IProps {
  columns: ITableColumn[];
  record: IActivityRecord;
}

const Row = ({ record, columns }: IProps) => {
  const renderDefaultCell = (value: string) => {
    return <Typography variant="h6">{value}</Typography>;
  };

  return (
    <>
      <TableRow className="!py-2 px-0">
        {columns.map((column, i) => {
          const cellValue = get(record, column.field);

          return (
            <TableCell key={i} className="!py-1 px-0" align={column.align || 'left'}>
              {column.render ? column.render({ record }) : renderDefaultCell(cellValue)}
            </TableCell>
          );
        })}
      </TableRow>
    </>
  );
};

export default Row;
