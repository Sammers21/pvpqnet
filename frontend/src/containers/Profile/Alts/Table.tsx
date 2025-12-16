import { useMemo, useState } from "react";
import {
  Table as TableMui,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  TableBody,
  TableCell,
} from "@mui/material";
import { styled } from "@mui/system";

import HeaderCell from "@/components/AltsTable/SortableHeaderCell";
import Row from "@/components/AltsTable/Row";

import type { Alt, TableColumn } from "@/types";
import { getClassIcon, getClassNameColor, getRaceIcon } from "@/utils/table";

const Table = styled(TableMui)({
  width: "100%",
  tableLayout: "auto",
  "tbody tr:nth-of-type(odd)": {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  "& tbody tr:hover": {
    backgroundColor: "rgba(96, 165, 250, 0.15)",
  },
  "& tr": {
    height: "40px !important",
  },
  "& tr td,th": {
    borderBottom: "none",
  },
});

interface IProps {
  columns: TableColumn[];
  records: Alt[];
  isMobile: boolean;
  isLoading?: boolean;
  initialSort?: { field: keyof Alt; sort: "asc" | "desc" };
}

const MobileCard = ({
  record,
  columns,
}: {
  record: Alt;
  columns: TableColumn[];
}) => {
  const classImg = getClassIcon(record.class);
  const raceImg = getRaceIcon(record.gender, record.race);
  const classColor = getClassNameColor(record.class);

  // Helper to find and render a column by field
  const renderCol = (field: string) => {
    const col = columns.find((c) => c.field === field);
    return col ? col.render({ record }) : null;
  };

  const statusContent = renderCol("status");
  const visibilityContent = renderCol("visibility");
  const regionContent = renderCol("region");

  const bracketFields = [
    { label: "Shuffle", field: "SHUFFLE" },
    { label: "Blitz", field: "BLITZ" },
    { label: "3v3", field: "ARENA_3v3" },
    { label: "2v2", field: "ARENA_2v2" },
    { label: "RBG", field: "BATTLEGROUNDS" },
  ];

  return (
    <div className="relative mb-3 flex flex-col rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 shadow-sm backdrop-blur-sm">
      {/* Header: Status, Identity */}
      <div className="flex items-center justify-between border-b border-slate-700/40 pb-2.5">
        <div className="flex items-center gap-3">
           {/* Status icon if present, else placeholder space */}
           <div className="flex items-center justify-center w-5 h-5">
             {statusContent}
           </div>

          <div className="relative h-10 w-10 shrink-0">
            <img
              src={classImg}
              alt={record.class}
              className="h-full w-full rounded-lg border border-slate-600 shadow-md"
            />
            <img
              src={raceImg}
              alt={record.race}
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border border-slate-800 bg-slate-800 shadow-sm"
            />
          </div>

          <div className="flex flex-col">
            <span
              className="text-base font-bold leading-tight"
              style={{ color: classColor }}
            >
              {record.name}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {record.realm} 
              {record.level ? ` • Lvl ${record.level}` : ""}
            </span>
          </div>
        </div>
        
        {/* Region */}
        <div className="shrink-0 opacity-80 scale-90">
             {regionContent}
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-3">
        {bracketFields.map((b) => {
            const content = renderCol(b.field);
            // Check if content is essentially empty or just a dash (from renderBracket default) -> we might hide it or show simplified
            // But renderBracket returns a div, so we just render it.
            return (
                <div key={b.field} className="flex flex-col px-1">
                   <span className="text-[10px] uppercase font-bold text-slate-500 mb-0.5">{b.label}</span>
                   <div className="-ml-1">{content}</div>
                </div>
            )
        })}
      </div>

      {/* Footer: Actions (Visibility) */}
      {visibilityContent && (
        <div className="mt-3 flex items-center justify-end border-t border-slate-700/40 pt-2.5">
           {visibilityContent}
        </div>
      )}
    </div>
  );
};

const AltsTable = ({
  columns,
  records = [],
  isMobile,
  isLoading,
  initialSort,
}: IProps) => {
  const [sort, setSort] = useState<{ field: keyof Alt; sort: "asc" | "desc" }>(
    initialSort || {
      field: "SHUFFLE",
      sort: "desc",
    }
  );

  const processedRecords = useMemo(() => {
    function sortRecords(
      records: Alt[],
      sort: { field: keyof Alt; sort: "asc" | "desc" }
    ) {
      return records.sort((a, b) => {
        if (sort.sort === "desc") {
          return (a[sort.field] as number) > (b[sort.field] as number) ? -1 : 1;
        }
        return (a[sort.field] as number) > (b[sort.field] as number) ? 1 : -1;
      });
    }
    return sortRecords([...records], sort);
  }, [records, sort]);

  // Mobile View
  if (isMobile) {
    if (isLoading) {
      return (
        <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={160} className="rounded-xl !bg-slate-800/50" />
            ))}
        </div>
      )
    }
    return (
      <div className="flex flex-col pb-4">
        {processedRecords.map((record, index) => (
          <MobileCard key={record.id || index} record={record} columns={columns} />
        ))}
      </div>
    );
  }

  // Desktop View
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

  const renderBody = () => {
    if (isLoading) {
      return (
        <TableBody>
          {[...Array(40)].map((_, index) => (
            <TableRow key={index}>
              {columns.map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    variant="text"
                    width="100%"
                    height={20}
                    sx={{ bgcolor: "rgba(255, 255, 255, 0.1)" }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      );
    }
    return (
      <TableBody>
        {processedRecords.map((record, index) => (
          <Row key={index} record={record} columns={columns} />
        ))}
      </TableBody>
    );
  };

  return (
    <TableContainer>
      <Table padding="normal">
        <TableHead>
          <TableRow>{renderHeaderCells()}</TableRow>
        </TableHead>
        <colgroup>
          {columns.map((_col, index) => (
            <col key={index} />
          ))}
        </colgroup>
        {records.length || isLoading ? renderBody() : null}
      </Table>
    </TableContainer>
  );
};

export default AltsTable;
