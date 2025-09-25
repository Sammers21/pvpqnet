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
import type { CharacterAndDiff, TableColumn } from "@/types";
const StyledTable = styled(TableMui)({
  "tbody tr:nth-of-type(odd)": {
    backgroundColor: "rgba(31, 41, 55, 0.3)",
  },
  "tbody tr:nth-of-type(even)": {
    backgroundColor: "rgba(17, 24, 39, 0.3)",
  },
  "tbody tr:hover": {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    transition: "background-color 0.2s ease-in-out",
  },
  "& tr td,th": {
    borderBottom: "1px solid rgba(75, 85, 99, 0.2)",
  },
  "& thead tr": {
    backgroundColor: "rgba(31, 41, 55, 0.5)",
    backdropFilter: "blur(10px)",
  },
});
interface IProps {
  loading?: boolean;
  columns: TableColumn[];
  records: CharacterAndDiff[];
  totalPages: number;
  pagination: boolean;
  page: number;
  onPageChange: (_: unknown, page: number) => void;
  onRowOver: (record: CharacterAndDiff | null) => void;
  diff: CharacterAndDiff | null;
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
    function renderRow(record: CharacterAndDiff, index: number) {
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
          <div className="text-center">
            <div className="text-gray-400 text-lg font-medium mb-2">
              No data currently available
            </div>
            <div className="text-gray-500 text-sm">
              Try adjusting your filters or check back later
            </div>
          </div>
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
    <div className="relative bg-transparent" style={{ minHeight: "250px" }}>
      {renderFooter()}
      <div className="overflow-hidden rounded-b-xl">
        <TableContainer className="max-h-[70vh] overflow-auto">
          {renderTable()}
        </TableContainer>
      </div>
      {!records.length && !loading && renderNoRowsOverlay()}
      {renderLoading()}
      {renderFooter()}
    </div>
  );
};
export default Table;
