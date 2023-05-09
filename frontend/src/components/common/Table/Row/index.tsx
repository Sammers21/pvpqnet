import { Fragment, useEffect, useState } from 'react';
import { TableCell, TableRow, Typography } from '@mui/material';
import get from 'lodash/get';

interface IProps {
  columns: any;
  record: any;
}

const Row = ({ record, columns }: IProps) => {
  const [columnsData, setColumnsData] = useState<any[]>([]);

  const setValues = async () => {
    let columnsData = [];

    for (let column of columns) {
      columnsData.push(column);
    }

    setColumnsData(columnsData);
  };

  const renderDefaultCell = (value: string) => {
    return <Typography variant="h6">{value}</Typography>;
  };

  useEffect(() => {
    setValues();
  }, [columns]);

  return (
    <Fragment>
      <TableRow sx={{ padding: '4px 0' }}>
        {columnsData.map((column, i) => {
          const cellValue = column.value || get(record, column.field);

          return (
            <TableCell sx={{ padding: '4px 0' }} key={record[i]} align={column.align || 'left'}>
              {column.render
                ? column.render({
                    id: record[i],
                    field: column.field,
                    value: cellValue,
                    record,
                  })
                : renderDefaultCell(cellValue)}
            </TableCell>
          );
        })}
      </TableRow>
    </Fragment>
  );
};

export default Row;
