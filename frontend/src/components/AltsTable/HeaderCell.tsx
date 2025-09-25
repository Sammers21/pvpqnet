import { TableCell } from "@mui/material";

import type { TableColumn } from "@/types";

interface IProps {
  column: TableColumn;
}

const HeaderCell = ({ column }: IProps) => {
  const { align = "left", label } = column;
  return (
    <TableCell 
      align={align}
      sx={{
        color: "white",
        fontWeight: 600,
        fontSize: "0.875rem",
        padding: "12px 8px",
        borderBottom: "1px solid rgba(75, 85, 99, 0.3)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </TableCell>
  );
};

export default HeaderCell;
