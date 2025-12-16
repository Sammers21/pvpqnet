import { useEffect, useRef, useState } from "react";
import { get } from "lodash";
import { TableCell, TableRow, Typography } from "@mui/material";
import { styled, keyframes } from "@mui/system";

import type { TableColumn } from "@/types";
interface IProps {
  columns: TableColumn[];
  record: any;
  onRowOver?: (record: any | null) => void;
  bgColor?: string;
  shouldHighlight?: boolean;
  altHighlight?: boolean;
}

const flashAnimation = keyframes`
  0% { background-color: rgba(59, 130, 246, 0.5); }
  100% { background-color: transparent; }
`;

const HoverRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== "shouldFlash",
})<{ shouldFlash?: boolean }>(({ shouldFlash }) => ({
  position: "relative",
  transition: "background-color 180ms ease, box-shadow 180ms ease",
  animation: shouldFlash ? `${flashAnimation} 1.5s ease-out` : "none",
  "&:hover": {
    backgroundColor: "rgba(56,189,248,0.08) !important",
    boxShadow: "inset 0 0 0 1px rgba(56,189,248,0.1)",
  },
}));

const Row = ({
  record,
  columns,
  shouldHighlight,
  altHighlight,
  bgColor,
  onRowOver,
}: IProps) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const lastUpdateRef = useRef<number | undefined>(record?._updatedAt);

  useEffect(() => {
    if (record?._updatedAt && record._updatedAt !== lastUpdateRef.current) {
      lastUpdateRef.current = record._updatedAt;
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [record?._updatedAt]);

  const href = window.location.href;
  let bgClass = shouldHighlight
    ? "rgba(59, 130, 246, 0.18)"
    : altHighlight
      ? "rgba(79, 70, 229, 0.18)"
      : "";
  if (href.indexOf("ladder") > -1 || href.indexOf("shuffle") > -1) {
    bgClass = altHighlight ? "rgba(59, 130, 246, 0.22)" : "";
  }
  const renderDefaultCell = (value: string) => {
    return <Typography variant="h6">{value}</Typography>;
  };
  return (
    <HoverRow
      shouldFlash={isFlashing}
      onMouseEnter={() => onRowOver && onRowOver(record)}
      onMouseLeave={() => onRowOver && onRowOver(null)}
      className="!py-2 px-0"
      style={{ backgroundColor: bgColor ?? bgClass }}
    >
      {columns.map((column, i) => {
        const cellValue = get(record, column.field);
        if (column.width) {
          return (
            <TableCell
              key={i}
              className="!py-1 px-0 "
              style={{ width: column.width }}
              align={column.align || "left"}
            >
              {column.render
                ? column.render({ record })
                : renderDefaultCell(cellValue)}
            </TableCell>
          );
        } else {
          return (
            <TableCell
              key={i}
              className="!py-1 px-0 "
              align={column.align || "left"}
            >
              {column.render
                ? column.render({ record })
                : renderDefaultCell(cellValue)}
            </TableCell>
          );
        }
      })}
    </HoverRow>
  );
};

export default Row;
