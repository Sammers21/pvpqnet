import { get } from 'lodash';

import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import type { IActivityRecord, ITableColumn } from '../../../types';
interface IProps {
  columns: ITableColumn[];
  record: IActivityRecord;
  onRowOver: (record: IActivityRecord | null) => void;
  shouldHighlight: boolean;
}

const Row = ({ record, columns, shouldHighlight, onRowOver }: IProps) => {
  const bgClass = shouldHighlight ? '#0e1216' : '';

  const renderDefaultCell = (value: string) => {
    return <Typography variant="h6">{value}</Typography>;
  };

  return (
    <TableRow
      onMouseEnter={() => onRowOver(record)}
      onMouseLeave={() => onRowOver(null)}
      className={`${bgClass} !py-2 px-0`}
      style={{ backgroundColor: bgClass }}
    >
      {columns.map((column, i) => {
        const cellValue = get(record, column.field);

        return (
          <TableCell key={i} className="!py-1 px-0" align={column.align || 'left'}>
            {column.render ? column.render({ record }) : renderDefaultCell(cellValue)}
          </TableCell>
        );
      })}
    </TableRow>
  );
};

export default Row;
