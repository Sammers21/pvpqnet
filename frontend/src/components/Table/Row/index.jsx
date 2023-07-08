import React, {Fragment, useEffect, useState} from 'react';
import {TableCell, TableRow, Typography} from '@mui/material';
import _get from 'lodash/get';
import _ from 'lodash';

const Row = ({curDiff, onMouseOverDiff, index, record, columns}) => {
  const [columnsData, setColumnsData] = useState([]);
console.log(record)
  const setValues = async () => {
    let columnsData = [];
    for (let column of columns) {
      columnsData.push(column);
    }
    setColumnsData(columnsData);
  };

  const renderDefaultCell = (value) => {
    return <Typography variant="h6">{value}</Typography>;
  };

  useEffect(() => {
    setValues();
  }, [columns, curDiff]);
  const even = index % 2 === 0;
  const sx = {padding: '4px 0'};
  if (even) {
    sx.backgroundColor = "#0e1216";
  }
  if(!_.isEmpty(curDiff) && curDiff.won ==record.diff.won && curDiff.lost ==record.diff.lost){
    sx.backgroundColor = 'rgb(21, 128, 61, 0.25)';
  }
  const enter = () => {
    if(record.diff){
      onMouseOverDiff(record.diff);
    }
  }
  const leave = () => {
    if(record.diff){
      onMouseOverDiff({});
    }
  }
  return (
      <Fragment>
        <TableRow sx={sx}
                  onMouseEnter={() => enter()}
                  onMouseLeave={() => leave()}>
          {columnsData.map((column, i) => {
            const cellValue = column.value || _get(record, column.field);
            return (
              <TableCell sx={{padding: '4px 0'}} key={record[i]} align={column.align || 'left'}>
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
