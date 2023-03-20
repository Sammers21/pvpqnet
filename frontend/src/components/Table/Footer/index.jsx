import React, { useCallback, useMemo } from 'react';

import { Grid, IconButton } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';

const Footer = ({
  page,
  pageSize,
  itemsCount,
  isFirstPage,
  pagination,
  onPageChange,
  recordsLength,
}) => {
  const renderTableRowInfo = useCallback(
    (isLastPage) => {
      const displayedCountFirst = `${page > 1 ? (page - 1) * pageSize + 1 : 1}`;
      const displayedCountLast = isLastPage ? itemsCount : pageSize * page;

      return `${displayedCountFirst} - ${displayedCountLast} ${'of'} ${itemsCount}`;
    },
    [page, itemsCount]
  );

  const TablePageControls = useMemo(() => {
    if (itemsCount === 0) {
      return null;
    }

    const lastPage = Math.ceil(itemsCount / pageSize);

    return (
      <Grid>
        {renderTableRowInfo(page === lastPage)}
        <Grid>
          <IconButton disabled={isFirstPage} onClick={() => onPageChange(page - 1)}>
            <ArrowBackIos />
          </IconButton>

          <IconButton disabled={page === lastPage} onClick={() => onPageChange(page + 1)}>
            <ArrowForwardIos />
          </IconButton>
        </Grid>
      </Grid>
    );
  }, [itemsCount, page]);

  const renderFooter = () => {
    const visible = pagination && !!recordsLength;

    return (
      visible && (
        <Grid container alignItems="center" justifyContent="flex-end">
          <Grid>{TablePageControls}</Grid>
        </Grid>
      )
    );
  };

  return renderFooter();
};

export default Footer;
