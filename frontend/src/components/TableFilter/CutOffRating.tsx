
import {getRatingColor} from "@/utils/table";
import {useSearchParams} from "react-router-dom";
import {getFromSearchParams} from "../DataTable";
import {useEffect, useState} from "react";

import {
  SEARCH_PARAM_TO_SPEC,
} from "@/constants/filterSchema";
import { title } from "process";
import { toUpper } from "lodash";

interface IProps {
  bracket: string;
  stats: any;
}

const ratingRewardMap = {
  "3v3": "ARENA_3v3",
  rbg: "BATTLEGROUNDS/alliance",
};

const CutOffText = ({ bracket, stats }: IProps) => {
  const [searchParams] = useSearchParams();
  const [selectedSpecs, setSelectedSpecs] = useState(
    getFromSearchParams(searchParams, "specs")
  );
  const rankOneTitleColor = getRatingColor(true);
  const rewards = stats?.cutoffs?.rewards;
  const spotWithNoAlts = stats?.cutoffs?.spotWithNoAlts;
  const predictions = stats?.cutoffs?.predictions;

  useEffect(() => {
    setSelectedSpecs(getFromSearchParams(searchParams, "specs"));
  }, [searchParams]);
  if (bracket === "rbg" || bracket === "3v3") {
    const cutOffRating = rewards?.[ratingRewardMap[bracket]];
    const spotsWithNoAlts = spotWithNoAlts?.[ratingRewardMap[bracket]];
    const predictedCutoff = predictions?.[`${ratingRewardMap[bracket]}`];
    return (

      <>
        <span
          className="text-xs sm:text-lg font-light gap-[5px] flex"
          >
          <div className="p-[5px] border border-solid border-[#3f6ba3] flex justify-between rounded bg-gray-900 w-[200px]">
            3x3 R1: <span className="text-[20px]" style={{color: rankOneTitleColor}}>{cutOffRating}</span>
          </div>
          <div className="p-[5px] border border-solid border-[#3f6ba3] flex justify-between rounded bg-gray-900 w-[200px]">
            Predicted cutoff: <span className="text-[20px]" style={{color: rankOneTitleColor}}>{predictedCutoff}</span>
          </div>
          <div className="p-[5px] border border-solid border-[#3f6ba3] flex justify-between rounded bg-gray-900 w-[200px]">
            Spots:
            <span className="text-[20px]">
              {spotsWithNoAlts}</span>
          </div>
        </span>
      </>
    );
  } else if ((bracket === "shuffle" || bracket === 'blitz') && selectedSpecs.length === 1) {
    const key = `${bracket === 'shuffle' ?'SHUFFLE' : 'BLITZ'}/${SEARCH_PARAM_TO_SPEC[selectedSpecs[0]]}`;
    const cutOffRating = rewards?.[key];
    const spotsWithNoAlts = spotWithNoAlts?.[key];
    const predictedCutoff = predictions?.[key];
    return (
      <>
        <span
          className="text-xs sm:text-lg font-light gap-[5px] flex"
          >
          <div className="p-[5px] border border-solid border-[#3f6ba3] flex justify-between rounded bg-gray-900 w-[200px]">
             {bracket === 'shuffle' ? 'R1 Legend': "R1 Blitz"}: <span className="text-[20px]" style={{color: rankOneTitleColor}}>{cutOffRating}</span>
          </div>
          <div className="p-[5px] border border-solid border-[#3f6ba3] flex justify-between rounded bg-gray-900 w-[200px]">
            Predicted cutoff: <span className="text-[20px]" style={{color: rankOneTitleColor}}>{predictedCutoff}</span>
          </div>
          <div className="p-[5px] border border-solid border-[#3f6ba3] flex justify-between rounded bg-gray-900 w-[200px]">
            Spots:
            <span className="text-[20px]">
              {spotsWithNoAlts}</span>
          </div>
        </span>
      </>
    );
  } else if ((bracket === "shuffle" || bracket === "blitz") && selectedSpecs.length === 0) {

    return (
      <span
        className="text-xs sm:text-lg font-light"
        style={{ color: rankOneTitleColor }}
      >
        Select the spec filter to see the cutoff rating
      </span>
    );
  } else if (
    (bracket === "shuffle" || bracket === "blitz") &&
    selectedSpecs.length > 1
  ) {
    return (
      <span
        className="text-xs sm:text-lg font-light"
        style={{ color: rankOneTitleColor }}
      >
        Select only one spec to see the cutoff rating
      </span>
    );
  } else {
    return <div></div>;
  }
};

const CutOffRating = ({ bracket, stats }: IProps) => {
  if (
    !stats?.cutoffs?.rewards?.ARENA_3v3 ||
    !["shuffle", "rbg", "3v3", "blitz"].includes(bracket)
  ) {
    return <div></div>;
  }
  return (
    <div className="flex items-center mr-2">
      <CutOffText stats={stats} bracket={bracket}/>

    </div>
  );
};

export default CutOffRating;
