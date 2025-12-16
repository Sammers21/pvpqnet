import { Pagination } from "@mui/material";
import { cn } from "@/utils/classnames";

interface IProps {
  page: number;
  totalPages: number;
  pagination: boolean;
  onPageChange: (event: React.ChangeEvent<unknown>, page: number) => void;
  recordsLength: number;
  className?: string;
  loading?: boolean;
}

const TablePagination = ({ page, totalPages, pagination, onPageChange, recordsLength, className, loading }: IProps) => {
  const visible = pagination && (recordsLength > 0 || loading);

  return visible ? (
    <div className={cn("flex justify-center mt-8 mb-4", className)}>
      <Pagination
        count={Math.max(totalPages, 1)}
        page={page}
        onChange={onPageChange}
        showFirstButton
        showLastButton
        shape="rounded"
        size="medium"
        sx={{
          "& .MuiPaginationItem-root": {
            color: "#94a3b8", // slate-400
            borderColor: "rgba(148, 163, 184, 0.1)",
            backgroundColor: "rgba(15, 23, 42, 0.3)", // slate-900/30
            backdropFilter: "blur(4px)",
            transition: "all 0.2s ease",
            margin: "0 3px",
            "&:hover": {
              backgroundColor: "rgba(14, 165, 233, 0.15)", // sky-500/15
              color: "#f1f5f9", // slate-100
              borderColor: "rgba(14, 165, 233, 0.3)",
            },
            "&.Mui-selected": {
              backgroundColor: "rgba(14, 165, 233, 0.15)", // sky-500/15
              color: "#38bdf8", // sky-400
              fontWeight: "bold",
              border: "1px solid rgba(14, 165, 233, 0.4)",
              boxShadow: "0 0 10px rgba(14, 165, 233, 0.15)",
              "&:hover": {
                backgroundColor: "rgba(14, 165, 233, 0.25)",
              },
            },
            "&.MuiPaginationItem-ellipsis": {
              color: "#64748b", // slate-500
            },
          },
        }}
      />
    </div>
  ) : null;
};

export default TablePagination;
