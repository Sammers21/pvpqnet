import { get } from "lodash";
import { TableCell, TableRow, Typography } from "@mui/material";

import type { ITableColumn } from "@/types";
interface IProps {
  columns: ITableColumn[];
  record: any;
  onRowOver?: (record: any | null) => void;
  bgColor?: string;
  shouldHighlight?: boolean;
  altHighlight?: boolean;
}

const Row = ({
  record,
  columns,
  shouldHighlight,
  altHighlight,
  bgColor,
  onRowOver,
}: IProps) => {
  const href = window.location.href
  let bgClass = shouldHighlight ? "rgb(21, 128, 61, 0.25)" : altHighlight ? "rgb(96, 165, 250, 0.25)" : '';
  if(href.indexOf("ladder") > -1 || href.indexOf("shuffle") > -1) {
      bgClass = altHighlight ? "rgb(96, 165, 250, 0.25)" : '';
  }
  const renderDefaultCell = (value: string) => {
    return <Typography variant="h6">{value}</Typography>;
  };
  return (
    <TableRow
      onMouseEnter={() => onRowOver && onRowOver(record)}
      onMouseLeave={() => onRowOver && onRowOver(null)}
      className={`${bgClass} !py-2 px-0`}
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
    </TableRow>
  );
};

export default Row;
