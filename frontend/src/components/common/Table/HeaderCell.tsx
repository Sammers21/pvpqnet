import { TableCell } from '@mui/material';

import type { ITableColumn } from '@/types';

interface IProps {
  column: ITableColumn;
}

const HeaderCell = ({ column }: IProps) => {
  const { align = 'left', label } = column;

  return <TableCell align={align}>{label}</TableCell>;
};

export default HeaderCell;
