import React from 'react';
import { TableCell } from '@mui/material';

const HeaderCell = ({ column, title, render }) => {
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
