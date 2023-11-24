import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { isEmpty } from "lodash";

import { Button, Typography } from "@mui/material";
import Spec from "./Spec";
import { CRESTS_AND_SPECS } from "@/constants/filterSchema";
import {
  bracketToColor,
  getRatingColor,
  getSeasonRankImageFromRating,
} from "@/utils/table";

interface IProps {
  selectedSpecs: string[];
  onSpecsChange: (specs: string[]) => void;
  bracket: string;
  statistic: any;
}

const TableFilter = ({
  selectedSpecs,
  onSpecsChange,
  bracket,
  statistic,
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
  let cutoff;
  let ctRating = 0;
  const r1TitleColor = getRatingColor(true);
  const r1Img = (
    <img
      className="w-7 h-7 mx-1"
      src={getSeasonRankImageFromRating(0, true)}
      alt="rating"
    />
  );
  const ssnName = "Verdant"
  const ssnCnt = 3
  if (statistic === undefined 
    || statistic.cutoffs === undefined 
    || statistic.cutoffs.rewards=== undefined
    || statistic.cutoffs.rewards.ARENA_3v3 === undefined) {
    cutoff = <div></div>;
  } else if (bracket === "3v3") {
    if (statistic !== undefined) {
      ctRating = statistic.cutoffs.rewards.ARENA_3v3;
    }
    cutoff = (
      <div className="flex">
        {r1Img}
        <span
          className="text-lg font-light mr-2"
          style={{ color: r1TitleColor }}
        >
          {ssnName} Gladiator: Dragonflight Season {ssnCnt} - Rating: {ctRating}
        </span>
      </div>
    );
  } else if (bracket === "rbg") {
    if (statistic !== undefined) {
      ctRating = statistic.cutoffs.rewards["BATTLEGROUNDS/alliance"];
    }
    cutoff = (
      <div className="flex">
        {r1Img}
        <span
          className="text-lg font-light mr-2"
          style={{ color: r1TitleColor }}
        >
          Hero of the Alliance & Horde: {ssnName} - Rating: {ctRating}
        </span>
      </div>
    );
  } else {
    cutoff = <div></div>;
  }
  return (
    <div className="bg-[#030303e6] px-8">
      <div className="flex justify-between pt-6 pb-0">
        {cutoff}
        <Button className="!px-8 !bg-[#1F2937]" onClick={toggleFilterShown}>
          Filters
          {!isEmpty(selectedSpecs) && (
            <div className="flex justify-center items-center absolute w-6 h-6 -top-2 -right-2 bg-[#1769aa] text-[#fff] rounded-full text-xs">
              {selectedSpecs.length}
            </div>
          )}
        </Button>
      </div>

      <div
        className={
          filtersShown
            ? "visible pt-4"
            : "invisible h-0 min-h-0 overflow-hidden"
        }
      >
        <div className="flex flex-wrap justify-center gap-8">
          {Object.entries(CRESTS_AND_SPECS).map(([crestId, specs]) => {
            return (
              <Spec
                crestId={crestId}
                specs={specs}
                handleSpecsSelect={handleSpecsSelect}
                selectedSpecs={selectedSpecs}
              />
            );
          })}
        </div>

        <div className="flex justify-end py-4">
          <Button
            className="!px-8 !bg-[#1f2937]"
            disabled={isEmpty(selectedSpecs)}
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TableFilter;
