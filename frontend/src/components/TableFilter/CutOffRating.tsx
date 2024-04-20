import { getRatingColor, getSeasonRankImageFromRating } from "@/utils/table";
import { useSearchParams } from "react-router-dom";
import { getFromSearchParams } from "../DataTable";
import { useEffect, useState } from "react";
import {
  SEARCH_PARAM_TO_FULL_SPEC,
  SEARCH_PARAM_TO_SPEC,
} from "@/constants/filterSchema";

interface IProps {
  bracket: string;
  statistic: any;
}

const ratingRewardMap = {
  "3v3": "ARENA_3v3",
  rbg: "BATTLEGROUNDS/alliance",
};

const CutOffText = ({ bracket, statistic }: IProps) => {
  const [searchParams] = useSearchParams();
  const [selectedSpecs, setSelectedSpecs] = useState(
    getFromSearchParams(searchParams, "specs")
  );
  const rankOneTitleColor = getRatingColor(true);
  const rewards = statistic?.cutoffs?.rewards;
  const spotWithNoAlts = statistic?.cutoffs?.spotWithNoAlts;

  useEffect(() => {
    setSelectedSpecs(getFromSearchParams(searchParams, "specs"));
  }, [searchParams]);

  if (bracket === "rbg" || bracket === "3v3") {
    const cutOffRating = rewards?.[ratingRewardMap[bracket]];
    const spotsWithNoAlts = spotWithNoAlts?.[ratingRewardMap[bracket]];
    return (
      <span
        className="text-xs sm:text-lg font-light"
        style={{ color: rankOneTitleColor }}
      >
        {bracket === "3v3"
          ? `Verdant Gladiator - Rating: ${cutOffRating}. Spots: ${spotsWithNoAlts}`
          : `Hero: Verdant - Rating: ${cutOffRating}. Spots: ${spotsWithNoAlts}`}
      </span>
    );
  } else if (bracket === "shuffle" && selectedSpecs.length == 1) {
    const specName = SEARCH_PARAM_TO_FULL_SPEC[selectedSpecs[0]];
    const key = `SHUFFLE/${SEARCH_PARAM_TO_SPEC[selectedSpecs[0]]}`;
    const cutOffRating = rewards?.[key];
    const spotsWithNoAlts = spotWithNoAlts?.[key];
    return (
      <span
        className="text-xs sm:text-lg font-light"
        style={{ color: rankOneTitleColor }}
      >
        {`Verdant Legend for ${specName} - Rating: ${cutOffRating}. Spots: ${spotsWithNoAlts}`}
      </span>
    );
  } else if (bracket === "shuffle" && selectedSpecs.length == 0) {
    return (
      <span
        className="text-xs sm:text-lg font-light"
        style={{ color: rankOneTitleColor }}
      >
        Select the spec filter to see the cutoff rating
      </span>
    );
  } else if (bracket === "shuffle" && selectedSpecs.length > 1) {
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

const CutOffRating = ({ bracket, statistic }: IProps) => {
  if (
    !statistic?.cutoffs?.rewards?.ARENA_3v3 ||
    !["shuffle", "rbg", "3v3"].includes(bracket)
  ) {
    return <div></div>;
  }

  return (
    <div className="flex items-center mr-2">
      <img
        className="w-7 h-7 mr-2"
        src={getSeasonRankImageFromRating(0, true)}
        alt="Season Rank"
      />
      <CutOffText statistic={statistic} bracket={bracket} />
    </div>
  );
};

export default CutOffRating;
