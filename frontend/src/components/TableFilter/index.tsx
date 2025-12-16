import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isEmpty } from "lodash";

import { Button, Pagination } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import Spec from "./Spec";
import CutOffRating from "./CutOffRating";

import { CRESTS_AND_SPECS } from "@/constants/filterSchema";

interface IProps {
  selectedSpecs: string[];
  onSpecsChange: (specs: string[]) => void;
  bracket: string;
  statistics: any;
  page?: number;
  totalPages?: number;
  onPageChange?: (event: React.ChangeEvent<unknown>, page: number) => void;
  showPagination?: boolean;
}

const TableFilter = ({
  selectedSpecs,
  onSpecsChange,
  bracket,
  statistics: stats,
  page = 1,
  totalPages = 0,
  onPageChange,
  showPagination = false,
}: IProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filtersShown, setFiltersShown] = useState(selectedSpecs.length > 0);
  const hasActiveFilters = !isEmpty(selectedSpecs);

  const toggleFilterShown = () => {
    setFiltersShown(!filtersShown);
  };

  const resetFilters = () => {
    navigate(location.pathname);
    onSpecsChange([]);
  };

  const handleSpecsSelect = (newSpecs: string[]) => {
    if (newSpecs.length === 0) {
      resetFilters();
    } else {
      navigate(location.pathname + "?specs=" + newSpecs.join(","));
      onSpecsChange(newSpecs);
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Expandable Filter Area */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          filtersShown ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 backdrop-blur md:p-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {Object.entries(CRESTS_AND_SPECS).map(([crestId, specs]) => (
              <Spec
                key={crestId}
                crestId={crestId}
                specs={specs}
                handleSpecsSelect={handleSpecsSelect}
                selectedSpecs={selectedSpecs}
              />
            ))}
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-800 pt-4">
            <Button
              size="small"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="!text-slate-400 hover:!text-white disabled:!opacity-30"
            >
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Top Bar: Cutoff, Pagination & Filter Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CutOffRating stats={stats} bracket={bracket} />

        {/* Pagination */}
        {showPagination && totalPages > 0 && onPageChange && (
          <div className="flex justify-center md:flex-1">
            <Pagination
              count={totalPages}
              page={page}
              onChange={onPageChange}
              showFirstButton
              showLastButton
              shape="rounded"
              size="medium"
              siblingCount={0}
              boundaryCount={1}
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#94a3b8",
                  borderColor: "rgba(148, 163, 184, 0.1)",
                  backgroundColor: "rgba(15, 23, 42, 0.3)",
                  backdropFilter: "blur(4px)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "rgba(14, 165, 233, 0.15)",
                    color: "#f1f5f9",
                    borderColor: "rgba(14, 165, 233, 0.3)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(14, 165, 233, 0.15)",
                    color: "#38bdf8",
                    fontWeight: "bold",
                    border: "1px solid rgba(14, 165, 233, 0.4)",
                    "&:hover": {
                      backgroundColor: "rgba(14, 165, 233, 0.25)",
                    },
                  },
                },
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          {/* Active Filter Badge (when hidden) */}
          {!filtersShown && hasActiveFilters && (
            <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-400 ring-1 ring-inset ring-sky-500/20">
              {selectedSpecs.length} active
            </span>
          )}

          <Button
            onClick={toggleFilterShown}
            variant="outlined"
            className={`!h-10 !min-w-[100px] !border-slate-700 !px-4 !text-slate-300 !transition-all hover:!border-sky-500/50 hover:!bg-slate-800 hover:!text-white ${
              filtersShown ? "!border-sky-500 !bg-sky-500/10 !text-sky-400" : ""
            }`}
            startIcon={
              filtersShown ? (
                <CloseIcon fontSize="small" />
              ) : (
                <FilterListIcon fontSize="small" />
              )
            }
          >
            Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TableFilter;
