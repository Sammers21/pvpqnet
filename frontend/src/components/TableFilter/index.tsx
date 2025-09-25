import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isEmpty } from "lodash";
import { Button } from "@mui/material";
import Spec from "./Spec";
import CutOffRating from "./CutOffRating";
import { CRESTS_AND_SPECS } from "@/constants/filterSchema";
interface IProps {
  selectedSpecs: string[];
  onSpecsChange: (specs: string[]) => void;
  bracket: string;
  statistics: any;
}
const TableFilter = ({
  selectedSpecs,
  onSpecsChange,
  bracket,
  statistics: stats,
}: IProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filtersShown, setFiltersShown] = useState(selectedSpecs.length > 0);
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
    <div className="bg-gradient-to-r from-gray-800/30 to-gray-900/30 backdrop-blur-sm border-b border-gray-700/30 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-6 gap-4">
        <CutOffRating stats={stats} bracket={bracket} />
        <Button
          className="!px-6 !py-2 !text-white !bg-gradient-to-r !from-blue-600/20 !to-emerald-600/20 !border !border-blue-500/30 !rounded-lg !font-semibold !text-sm hover:!from-blue-600/30 hover:!to-emerald-600/30 transition-all duration-200"
          onClick={toggleFilterShown}
          sx={{
            position: "relative",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
            },
          }}
        >
          <span className="flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
              />
            </svg>
            Filters
          </span>
          {!isEmpty(selectedSpecs) && (
            <div className="flex justify-center items-center absolute w-5 h-5 -top-1 -right-1 bg-gradient-to-r from-blue-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-lg">
              {selectedSpecs.length}
            </div>
          )}
        </Button>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out ${
          filtersShown
            ? "visible opacity-100 max-h-screen pb-6"
            : "invisible opacity-0 max-h-0 overflow-hidden"
        }`}
      >
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 sm:p-6">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8">
            {Object.entries(CRESTS_AND_SPECS).map(([crestId, specs]) => {
              return (
                <Spec
                  key={crestId}
                  crestId={crestId}
                  specs={specs}
                  handleSpecsSelect={handleSpecsSelect}
                  selectedSpecs={selectedSpecs}
                />
              );
            })}
          </div>
          <div className="flex justify-end pt-4 sm:pt-6">
            <Button
              className="!px-6 !py-2 !bg-gradient-to-r !from-red-600/20 !to-red-700/20 !border !border-red-500/30 !text-red-100 !rounded-lg !font-semibold !text-sm hover:!from-red-600/30 hover:!to-red-700/30 transition-all duration-200"
              disabled={isEmpty(selectedSpecs)}
              onClick={resetFilters}
              sx={{
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                },
              }}
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Reset Filters
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TableFilter;
