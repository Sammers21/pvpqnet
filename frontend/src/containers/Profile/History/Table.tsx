import { useMemo, useState } from "react";
import {
  Table as TableMui,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { styled } from "@mui/system";

import HeaderCell from "@/components/AltsTable/SortableHeaderCell";
import Row from "@/components/AltsTable/Row";

import type { HistoryRow, TableColumn } from "@/types";
import bgImage from "../../../assets/background/smoke-table.jpg";
import AltsTable from "../Alts/Table";

const Table = styled(TableMui)({
  width: "100%",
  tableLayout: "auto",

  "& tbody": {
    backgroundImage: `url(${bgImage})`,
  },
  "& tr": {
    height: "40px !important",
  },
  "& th, td": {
    padding: "4px !important",
  },
  "& tr td,th": {
    borderColor: "rgb(71 85 105 / 0.5)",
  },
});

interface IProps {
  columns: TableColumn[];
  records: HistoryRow[];
  isMobile: boolean;
}

const HistoryTable = ({ columns, records = [], isMobile }: IProps) => {
  const [sort, setSort] = useState<{
    field: keyof HistoryRow;
    sort: "asc" | "desc";
  }>({
    field: "timestamp",
    sort: "desc",
  });

  const rowsComponent = useMemo(() => {
    function renderRow(record: HistoryRow, index: number) {
      function getRowColor(): string {
        if (record.RATING.diff.rating_diff === 0) return "#0c0c0cCC";
        return record.RATING.diff.rating_diff > 0 ? "#172517CC" : "#2b1715CC";
      }

      return (
        <Row
          key={index}
          record={record}
          columns={columns}
          bgColor={getRowColor()}
        />
      );
    }

    function sortRecords(
      records: HistoryRow[],
      sort: { field: keyof HistoryRow; sort: "asc" | "desc" }
    ) {
      return records.sort((a, b) => {
        if (sort.sort === "desc") {
          return (a[sort.field] as number) > (b[sort.field] as number) ? -1 : 1;
        }
        return (a[sort.field] as number) > (b[sort.field] as number) ? 1 : -1;
      });
    }

    return sortRecords(records, sort).map((record, index) =>
      renderRow(record, index)
    );
  }, [columns, records, sort]);

  const onSort = (field: any, sort: "asc" | "desc") => {
    setSort({ field, sort });
  };

  const renderHeaderCells = () => {
    return columns.map((column, index) => (
      <HeaderCell
        key={index}
        column={column}
        sort={sort}
        onSort={onSort}
        sortable={column.sortable ?? true}
      />
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
    return <TableBody>{rowsComponent}</TableBody>;
  };

  const renderTable = () => (
    <Table padding={isMobile ? "none" : "normal"}>
      {renderHeader()}
      <colgroup>
        {columns.map((_col, index) => (
          <col key={index} />
        ))}
      </colgroup>
      {records.length ? renderBody() : null}
    </Table>
  );

  return (
    <div className="relative w-full">
      <TableContainer>{renderTable()}</TableContainer>
      {!records.length && (
        <div className="min-h-[100px] flex justify-center items-center">
          <span className="text-lg text-slate-400">
            No history data available
          </span>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
