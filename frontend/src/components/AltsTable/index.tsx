import { useCallback, useMemo } from "react";
import {
  Table as TableMui,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { styled } from "@mui/system";
import EmptyState from "@/components/EmptyState";
import { cn } from "@/utils/classnames";

import HeaderCell from "./HeaderCell";
import Pagination from "./Pagination";
import Row from "./Row";

import type { CharacterAndDiff, TableColumn } from "@/types";

const PLACEHOLDER_ROW_COUNT = 24;
const MIN_TABLE_HEIGHT = PLACEHOLDER_ROW_COUNT * 44; // ~row height to reserve space during loading
const getSkeletonWidth = (field?: string) => {
  switch (field) {
    case "pos":
      return "36px";
    case "details":
      return "88px"; // 3 icons
    case "name":
      return "170px";
    case "realm":
      return "150px";
    case "stats":
      return "90px"; // won / lost
    case "rating":
      return "120px";
    case "lastSeen":
      return "110px";
    default:
      return "90px";
  }
};

const StyledTable = styled(TableMui)({
  borderCollapse: "separate",
  borderSpacing: 0,
  "tbody tr:nth-of-type(odd)": {
    backgroundColor: "rgba(15,23,42,0.6)",
  },
  "tbody tr:nth-of-type(even)": {
    backgroundColor: "rgba(10,15,25,0.5)",
  },
  "& th": {
    background:
      "linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)",
    borderBottom: "1px solid rgba(56,189,248,0.15)",
    borderTop: "none",
    color: "#94a3b8",
    fontSize: "10px",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "8px 4px",
    "@media (min-width: 640px)": {
      fontSize: "11px",
      padding: "10px 6px",
    },
    "@media (min-width: 768px)": {
      fontSize: "12px",
      padding: "12px 8px",
      letterSpacing: "0.05em",
    },
  },
  "& td": {
    borderBottom: "1px solid rgba(30,41,59,0.5)",
    padding: "6px 4px",
    "@media (min-width: 640px)": {
      padding: "7px 6px",
    },
    "@media (min-width: 768px)": {
      padding: "8px",
    },
  },
  "& tr:last-of-type td": {
    borderBottom: "none",
  },
  "& th:first-of-type": {
    borderTopLeftRadius: 6,
    "@media (min-width: 640px)": {
      borderTopLeftRadius: 8,
    },
  },
  "& th:last-of-type": {
    borderTopRightRadius: 6,
    "@media (min-width: 640px)": {
      borderTopRightRadius: 8,
    },
  },
  "& tr:last-of-type td:first-of-type": {
    borderBottomLeftRadius: 6,
    "@media (min-width: 640px)": {
      borderBottomLeftRadius: 8,
    },
  },
  "& tr:last-of-type td:last-of-type": {
    borderBottomRightRadius: 6,
    "@media (min-width: 640px)": {
      borderBottomRightRadius: 8,
    },
  },
  "& th:first-of-type, & td:first-of-type": {
    paddingLeft: 8,
    "@media (min-width: 640px)": {
      paddingLeft: 12,
    },
    "@media (min-width: 768px)": {
      paddingLeft: 16,
    },
  },
  "& th:last-of-type, & td:last-of-type": {
    paddingRight: 8,
    "@media (min-width: 640px)": {
      paddingRight: 12,
    },
    "@media (min-width: 768px)": {
      paddingRight: 16,
    },
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
  className?: string;
  hideTopPagination?: boolean;
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
  className,
  hideTopPagination = false,
}: IProps) => {
  const placeholderRows = useMemo(
    () => Array.from({ length: PLACEHOLDER_ROW_COUNT }),
    []
  );
  const showSkeleton = loading && records.length === 0;

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

  const renderLoading = () => null; // skeleton rows already indicate loading

  const renderNoRowsOverlay = useCallback(() => {
    return (
      !loading && (
        <div className="absolute inset-x-0 top-12 flex justify-center px-4">
          <EmptyState />
        </div>
      )
    );
  }, [loading]);

  const renderFooter = (position: "top" | "bottom") => {
    const spacing = position === "top" ? "mb-2 md:mb-3" : "mb-0 mt-4";
    return (
      <Pagination
        page={page}
        totalPages={totalPages}
        pagination={pagination}
        onPageChange={onPageChange}
        recordsLength={records.length}
        className={spacing}
        loading={loading}
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
    if (showSkeleton) {
      return (
        <TableBody aria-label="table-body-skeleton">
          {placeholderRows.map((_, rowIndex) => (
            <TableRow key={`skeleton-${rowIndex}`} className="animate-pulse">
              {columns.map((col, cellIndex) => {
                const skeletonWidth = getSkeletonWidth(col.field as string);
                const cellStyle = col.width ? { width: col.width } : { width: skeletonWidth };
                return (
                  <TableCell
                    key={cellIndex}
                    className="!py-2 px-0 "
                    style={cellStyle}
                    align={col.align || "left"}
                  >
                    <div
                      className="h-4 rounded bg-slate-800/60"
                      style={{ width: skeletonWidth }}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      );
    }

    if (!records.length) {
      return (
        <TableBody aria-label="table-body-empty">
          <TableRow>
            <TableCell colSpan={columns.length} className="!py-4 px-0" />
          </TableRow>
        </TableBody>
      );
    }

    return (
      <TableBody
        aria-label="table-body"
        sx={{
          opacity: loading ? 0.5 : 1,
          filter: loading ? "blur(2px)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        {rowsComponent}
      </TableBody>
    );
  };

  const renderTable = () => (
    <StyledTable size="small" padding="none" className="relative">
      {renderHeader()}
      <colgroup>
        {columns.map((_col, index) => (
          <col key={index} />
        ))}
      </colgroup>
      {renderBody()}
    </StyledTable>
  );

  return (
    <div
      className={cn("relative", className)}
      aria-busy={loading}
      style={{ minHeight: MIN_TABLE_HEIGHT }}
    >
      {!hideTopPagination && renderFooter("top")}
      <div className="overflow-hidden rounded-lg border border-slate-800/40 bg-slate-950/50 sm:rounded-xl">
        <TableContainer>{renderTable()}</TableContainer>
      </div>
      {!records.length && !loading && renderNoRowsOverlay()}
      {renderLoading()}
      {renderFooter("bottom")}
    </div>
  );
};

export default Table;
