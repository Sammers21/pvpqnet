import React, { useCallback, useMemo } from 'react';
import {
  Grid,
  TableContainer,
  Typography,
  Table as TableMui,
  TableHead,
  TableRow,
  TableBody,
} from '@mui/material';
import { styled } from '@mui/system';

import HeaderCell from './HeaderCell';
import Loading from '../Loading';
import Footer from './Footer';
import Row from './Row';

import { containerBg } from '../../theme';

const StyledTable = styled(TableMui)({
  '& tr:nth-child(even)': {
    backgroundColor: '#0e1216',
  },

  '& tr th': {
    border: 'none',
  },
});

const Table = ({
  loading,
  columns,
  records = [],
  headerRecords,
  itemsCount,
  pagination = false,
  pageSize = 10,
  startPageNumber = 1,
  page,
  sort,
  onPageChange,
  noDataIcon,
  noDataText = 'COMMON_NO-DATA',
  className = '',
  tableProps,
  ...props
}) => {
  const columnsData = columns;

  const isFirstPage = useMemo(() => {
    return page === startPageNumber;
  }, [page]);

  const renderNoRowsOverlay = useCallback(() => {
    return (
      !loading && (
        <Grid>
          {noDataIcon && <Grid>{noDataIcon}</Grid>}
          <Typography variant="h6">{noDataText}</Typography>
        </Grid>
      )
    );
  }, [loading, noDataText]);

  const renderFooter = () => {
    return (
      <Footer
        page={page}
        pageSize={pageSize}
        itemsCount={itemsCount}
        isFirstPage={isFirstPage}
        pagination={pagination}
        onPageChange={onPageChange}
        recordsLength={records.length}
      />
    );
  };

  const renderHeaderCells = () => {
    return columnsData.map((column, index) => {
      const title = column.label;

      return (
        <HeaderCell
          key={index}
          column={column}
          title={title}
          render={
            column.renderHeader &&
            (() => column.renderHeader({ field: column.field, records: headerRecords }))
          }
        />
      );
    });
  };

  const renderHeader = () => {
    return (
      <TableHead>
        <TableRow>{renderHeaderCells()}</TableRow>
      </TableHead>
    );
  };

  const renderRow = (record, index) => {
    return <Row key={index} index={index} record={record} fieldId={index} columns={columnsData} />;
  };

  const rowsComponent = useMemo(() => {
    return records.map((record, index) => renderRow(record, index));
  }, [records, renderRow]);

  const renderBody = () => {
    return <TableBody aria-label={'table-body'}>{rowsComponent}</TableBody>;
  };

  const renderLoading = () => {
    return loading && <Loading withBackdrop />;
  };

  const renderTable = () => (
    <StyledTable size="small" padding="none" {...tableProps}>
      {renderHeader()}
      <colgroup>
        {columnsData.map((column, index) => (
          <col
            key={index}
            style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
          />
        ))}
      </colgroup>
      {!records.length && !loading ? renderNoRowsOverlay() : renderBody()}
    </StyledTable>
  );

  return (
    <Grid sx={{ backgroundColor: containerBg, padding: '32px' }}>
      <TableContainer {...props}>{renderTable()}</TableContainer>
      {renderLoading()}
      {renderFooter()}
    </Grid>
  );
};

export default Table;