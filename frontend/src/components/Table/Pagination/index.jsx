import React, { useCallback, useMemo } from 'react';

import { Grid, IconButton, Pagination } from '@mui/material';

const TablePagination = ({ page, totalPages, pagination, onPageChange, recordsLength }) => {
  const renderFooter = () => {
    const visible = pagination && !!recordsLength;

    return (
      visible && (
        <Grid sx={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
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
