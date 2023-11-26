import { get } from 'lodash';
import { TableCell, TableRow, Typography } from '@mui/material';

import type { ITableColumn } from '@/types';
interface IProps {
  columns: ITableColumn[];
  record: any;
  onRowOver?: (record: any | null) => void;
  bgColor?: string;
  shouldHighlight?: boolean;
}

const Row = ({ record, columns, shouldHighlight, bgColor, onRowOver }: IProps) => {
  const bgClass = shouldHighlight ? 'rgb(21, 128, 61, 0.25)' : '';

  const renderDefaultCell = (value: string) => {
    return <Typography variant="h6">{value}</Typography>;
  };

  return (
    <TableRow
      onMouseEnter={() => onRowOver && onRowOver(record)}
      onMouseLeave={() => onRowOver && onRowOver(null)}
      className={`${bgClass} !py-2 px-0`}
      style={{ backgroundColor: bgColor ?? bgClass }}
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
