import { TableCell } from '@mui/material';

interface IProps {
  column: any;
  title: string;
  render: Function;
}

const HeaderCell = ({ column, title, render }: IProps) => {
  const { align = 'left', label } = column;
  const headerLabel = (title || label) && <div>{title || label}</div>;

  return (
    <TableCell align={align}>
      {render ? (
        <div>
          <div>
            {headerLabel}
            {render()}
          </div>
        </div>
      ) : (
        headerLabel
      )}
    </TableCell>
  );
};

export default HeaderCell;
