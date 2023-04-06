import React from 'react';

import {Grid, Pagination} from '@mui/material';

const TablePagination = ({ page, totalPages, pagination, onPageChange, recordsLength }) => {
  const renderFooter = () => {
    const visible = pagination && !!recordsLength;

    return (
      visible && (
        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', marginTop: '16px' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            hideNextButton
            hidePrevButton
          />
        </Grid>
      )
    );
  };

  return renderFooter();
};

export default TablePagination;
