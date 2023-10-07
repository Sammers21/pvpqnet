import { TableCell } from '@mui/material';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';

import type { ITableColumn } from '../../../types';

interface IProps {
  column: ITableColumn;
  onSort: (field: string, sort: 'asc' | 'desc') => void;
  sort: { field: string; sort: 'asc' | 'desc' };
}

const HeaderCell = ({ column, onSort, sort }: IProps) => {
  const { align = 'left', field, label } = column;

  const renderButtonHover = () => {
    return (
      <ArrowDownwardOutlinedIcon
        fontSize="small"
        className="invisible group-hover:visible text-gray-500"
      />
    );
  };

  const renderOrderArrow = (field: string) => {
    const sortByField = sort.field === field ? sort : null;
    if (!sortByField) return renderButtonHover();

    const ArrowIcon =
      sortByField.sort === 'desc' ? ArrowDownwardOutlinedIcon : ArrowUpwardOutlinedIcon;
    return <ArrowIcon fontSize="small" className="text-white" />;
  };

  return (
    <TableCell align={align}>
      <div
        onClick={() => onSort(field, sort.field === field && sort.sort === 'desc' ? 'asc' : 'desc')}
        className="group gap-2 flex w-full items-center cursor-pointer text-base"
      >
        {label}
        {renderOrderArrow(field)}
      </div>
    </TableCell>
  );
};

export default HeaderCell;
