import { TableCell } from "@mui/material";

import type { TableColumn } from "@/types";

interface IProps {
  column: TableColumn;
}

const HeaderCell = ({ column }: IProps) => {
  const { align = "left", label } = column;
  
  return  <TableCell align={align}>{label}</TableCell>
};

export default HeaderCell;
