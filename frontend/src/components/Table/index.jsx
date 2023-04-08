import React, {useCallback, useMemo} from 'react';
import {Grid, Table as TableMui, TableBody, TableContainer, TableHead, TableRow, Typography,} from '@mui/material';
import {styled} from '@mui/system';

import HeaderCell from './HeaderCell';
import BlizzardLoader from '../BlizzardLoader';
import Pagination from './Pagination';
import Row from './Row';

import {containerBg} from '../../theme';
import SpecFilter from "../SpecFilter";
import {useSearchParams} from "react-router-dom";

const StyledTable = styled(TableMui)({
  position: 'relative',
  minHeight: '200px',

  '& tr:nth-child(even)': {
    backgroundColor: '#0e1216',
  },

  '& tr td,th': {
    borderBottom: 'none',
  },
});

const Table = ({
  loading,
  columns,
  records = [],
  headerRecords,
  totalPages,
  pagination = false,
  pageSize = 10,
  startPageNumber = 1,
  page,
  sort,
  onPageChange,
  onSpecsChange,
  noDataText = 'No Data',
  className = '',
  tableProps,
  ...props
}) => {
  let [searchParams, setSearchParams] = useSearchParams();
  var specs = []
  if (searchParams.get('specs') != null){
    specs = searchParams.get('specs').split(',');
  }

  const columnsData = columns;

  const isFirstPage = useMemo(() => {
    return page === startPageNumber;
  }, [page]);

  const renderNoRowsOverlay = useCallback(() => {
    return (
      !loading && (
        <Grid sx={{ position: 'absolute', left: '45%', top: '50%' }}>
          <Typography variant="h5">{noDataText}</Typography>
        </Grid>
      )
    );
  }, [loading, noDataText]);

  const renderFooter = () => {
    return (
      <Pagination
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
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
    return loading && <BlizzardLoader withBackdrop />;
  };

  const renderSpecFilters = () => {
    return <SpecFilter specs={specs} onSpecsChange={onSpecsChange}/>;
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
    <Grid
      sx={{
        position: 'relative',
        backgroundColor: containerBg,
        padding: '12px 32px 32px 32px',
        minHeight: '200px',
      }}
    >
      {renderSpecFilters()}
      {renderFooter()}
      {<TableContainer {...props}>{renderTable()}</TableContainer>}
      {renderLoading()}
      {renderFooter()}
    </Grid>
  );
};

export default Table;
