import { getRatingColor, getSeasonRankImageFromRating } from "@/utils/table";
import { useSearchParams } from "react-router-dom";
import { getFromSearchParams } from "../DataTable";
import { useEffect, useState } from "react";
import {
  SEARCH_PARAM_TO_FULL_SPEC,
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

  const ssnName = "Prized";
  if (bracket === "rbg" || bracket === "3v3") {
    const cutOffRating = rewards?.[ratingRewardMap[bracket]];
    const spotsWithNoAlts = spotWithNoAlts?.[ratingRewardMap[bracket]];
    const predictedCutoff = predictions?.[`${ratingRewardMap[bracket]}`];
    const title =
      bracket === "3v3" ? `${ssnName} Gladiator` : `Hero: ${ssnName}`;
    var text;
    if (predictedCutoff === undefined || predictedCutoff === cutOffRating) {
      text = `${title} - Rating: ${cutOffRating}. Spots: ${spotsWithNoAlts}`;
    } else {
      text = `${title} - Rating by BlizzardAPI: ${cutOffRating} / Predicted: ${predictedCutoff}. Spots: ${spotsWithNoAlts}`;
    }
    return (
      <span
        className="text-xs sm:text-lg font-light"
        style={{ color: rankOneTitleColor }}
      >
        {text}
      </span>
    );
  } else if (
    (bracket === "shuffle" || bracket === "blitz") &&
    selectedSpecs.length === 1
  ) {
    const specName = SEARCH_PARAM_TO_FULL_SPEC[selectedSpecs[0]];
    const key = `${toUpper(bracket)}/${SEARCH_PARAM_TO_SPEC[selectedSpecs[0]]}`;
    const cutOffRating = rewards?.[key];
    const spotsWithNoAlts = spotWithNoAlts?.[key];
    const predictedCutoff = predictions?.[key];
    const title =
      bracket === "shuffle"
        ? `${ssnName} Legend`
        : `${ssnName} Marshal/Warlord`;
    var text;
    if (predictedCutoff === undefined || predictedCutoff === cutOffRating) {
      text = `${title} for ${specName} - Rating: ${cutOffRating}`;
    } else {
      text = `${title} for ${specName} - Rating by BlizzardAPI: ${cutOffRating} / Predicted: ${predictedCutoff}`;
    }
    if (spotsWithNoAlts !== undefined) {
      text += `. Spots: ${spotsWithNoAlts}`;
    }
    return (
      <span
        className="text-xs sm:text-lg font-light"
        style={{ color: rankOneTitleColor }}
      >
        {text}
      </span>
    );
  } else if (
    (bracket === "shuffle" || bracket === "blitz") &&
    selectedSpecs.length === 0
  ) {
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
  // return <div></div>;
  return (
    <div className="flex items-center mr-2">
      <img
        className="w-7 h-7 mr-2"
        src={getSeasonRankImageFromRating(0, true)}
        alt="Season Rank"
      />
      <CutOffText stats={stats} bracket={bracket} />
    </div>
  );
};

export default CutOffRating;
