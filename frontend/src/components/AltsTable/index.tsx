import { useCallback, useMemo } from "react";
import {
  Table as TableMui,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { styled } from "@mui/system";
import BlizzardLoader from "@/components/BlizzardLoader";

import HeaderCell from "./HeaderCell";
import Pagination from "./Pagination";
import Row from "./Row";

import type { IActivityRecord, ITableColumn } from "@/types";

const StyledTable = styled(TableMui)({
  "tbody tr:nth-of-type(odd)": {
    backgroundColor: "#0e1216",
  },
  "& tr td,th": {
    borderBottom: "none",
  },
});

interface IProps {
  loading?: boolean;
  columns: ITableColumn[];
  records: IActivityRecord[];
  totalPages: number;
  pagination: boolean;
  page: number;
  onPageChange: (_: unknown, page: number) => void;
  onRowOver: (record: IActivityRecord | null) => void;
  diff: IActivityRecord | null;
}

const Table = ({
  loading,
  columns,
  records = [],
  totalPages,
  pagination,
  page,
  onPageChange,
  onRowOver,
  diff,
}: IProps) => {
  const rowsComponent = useMemo(() => {
    function renderRow(record: IActivityRecord, index: number) {
      let shouldHighlight;
      let altHighlight;
      if (diff === record) {
        shouldHighlight = true;
        altHighlight = true;
      } else {
        shouldHighlight =
          diff && record.diff
            ? record.diff.last_seen === diff.diff?.last_seen &&
              record.diff.won === diff.diff.won &&
              record.diff.lost === diff.diff.lost
            : false;
        altHighlight =
          record &&
          diff &&
          record.pethash !== -1 &&
          diff.pethash !== -1 &&
          record.pethash &&
          diff.pethash
            ? diff.pethash === record.pethash
            : false;
      }
      return (
        <Row
          key={index}
          record={record}
          columns={columns}
          shouldHighlight={shouldHighlight}
          altHighlight={altHighlight}
          onRowOver={onRowOver}
        />
      );
    }

    return records.map((record, index) => renderRow(record, index));
  }, [columns, records, diff, onRowOver]);

  const renderLoading = () => {
    return loading && <BlizzardLoader />;
  };

  const renderNoRowsOverlay = useCallback(() => {
    return (
      !loading && (
        <div className="absolute inset-x-0 top-1/2 flex justify-center">
          <Typography variant="h5">No data currently available</Typography>
        </div>
      )
    );
  }, [loading]);

  const renderFooter = () => {
    return (
      <Pagination
        page={page}
        totalPages={totalPages}
        pagination={pagination}
        onPageChange={onPageChange}
        recordsLength={records.length}
      />
    );
  };

  const renderHeaderCells = () => {
    return columns.map((column, index) => (
      <HeaderCell key={index} column={column} />
    ));
  };

  const renderHeader = () => {
    return (
      <TableHead>
        <TableRow>{renderHeaderCells()}</TableRow>
      </TableHead>
    );
  };

  const renderBody = () => {
    return <TableBody aria-label="table-body">{rowsComponent}</TableBody>;
  };

  const renderTable = () => (
    <StyledTable size="small" padding="none" className="relative">
      {renderHeader()}
      <colgroup>
        {columns.map((_col, index) => (
          <col key={index} />
        ))}
      </colgroup>
      {records.length ? renderBody() : null}
    </StyledTable>
  );

  return (
    <div
      className="relative pt-3 pb-8 px-2 md:px-8 bg-[#030303e6]"
      style={{ minHeight: "250px" }}
    >
      {renderFooter()}
      {<TableContainer>{renderTable()}</TableContainer>}
      {!records.length && !loading && renderNoRowsOverlay()}
      {renderLoading()}
      {renderFooter()}
    </div>
  );
};

export default Table;
