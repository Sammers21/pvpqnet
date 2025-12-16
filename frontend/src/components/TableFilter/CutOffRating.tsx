import { getRatingColor, getSeasonRankImageFromRating } from "@/utils/table";
import { useSearchParams } from "react-router-dom";
import { getFromSearchParams } from "../DataTable";
import { useEffect, useState } from "react";
import { Tooltip } from "@mui/material";
import {
  SEARCH_PARAM_TO_FULL_SPEC,
  SEARCH_PARAM_TO_SPEC,
} from "@/constants/filterSchema";
import {
  ARENA_CUTOFF_KEY,
  BATTLEGROUND_ALLIANCE_KEY,
  BLITZ_CUTOFF_PREFIX,
  CUT_OFF_SEASON_NAME,
  CUT_OFF_TITLES,
  SHUFFLE_CUTOFF_PREFIX,
} from "@/constants/cutoffs";

interface IProps {
  bracket: string;
  stats: any;
}

const ratingRewardMap = {
  "3v3": ARENA_CUTOFF_KEY,
  rbg: BATTLEGROUND_ALLIANCE_KEY,
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

  const ssnName = CUT_OFF_SEASON_NAME;
  if (bracket === "rbg" || bracket === "3v3") {
    const cutOffRating = rewards?.[ratingRewardMap[bracket]];
    const spotsWithNoAlts = spotWithNoAlts?.[ratingRewardMap[bracket]];
    const totalSpots = stats?.cutoffs?.spotCounts?.[ratingRewardMap[bracket]];
    const predictedCutoff = predictions?.[`${ratingRewardMap[bracket]}`];
    const title =
      bracket === "3v3" ? CUT_OFF_TITLES.arena3v3 : CUT_OFF_TITLES.battleground;
    return (
      <div className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-amber-500/20 bg-slate-900/40 px-4 py-2 backdrop-blur-md transition-all hover:border-amber-500/40 hover:bg-slate-900/60 sm:px-5">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-70" />

        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20 transition-all group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]">
          <img
            className="h-5 w-5 drop-shadow-md"
            src={getSeasonRankImageFromRating(0, true)}
            alt="Rank 1"
          />
        </div>

        <div className="relative flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/90">
            {title} Cutoff
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold leading-none text-amber-100 drop-shadow-sm sm:text-xl">
              {cutOffRating}
            </span>
            {predictedCutoff !== undefined &&
              predictedCutoff !== cutOffRating && (
                <span className="text-[10px] font-medium text-amber-500/60">
                  (Pred: {predictedCutoff})
                </span>
              )}
          </div>
        </div>

        {(totalSpots !== undefined || spotsWithNoAlts !== undefined) && (
          <div className="relative ml-auto hidden items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 sm:flex">
            <span className="text-xs font-semibold text-amber-300">
              {totalSpots !== undefined && <>{totalSpots} spots</>}
              {totalSpots !== undefined && spotsWithNoAlts !== undefined && (
                <span className="mx-1 text-amber-500/50">•</span>
              )}
              {spotsWithNoAlts !== undefined && <>{spotsWithNoAlts} uniq</>}
            </span>
            <Tooltip
              title="Unique spots means unique per Battle.net account (no alts counted)"
              arrow
              placement="top"
            >
              <span className="relative inline-flex cursor-help">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-400/70 hover:text-amber-300"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            </Tooltip>
          </div>
        )}
      </div>
    );
  } else if (
    (bracket === "shuffle" || bracket === "blitz") &&
    selectedSpecs.length === 1
  ) {
    const specName = SEARCH_PARAM_TO_FULL_SPEC[selectedSpecs[0]];
    const prefix =
      bracket === "shuffle" ? SHUFFLE_CUTOFF_PREFIX : BLITZ_CUTOFF_PREFIX;
    const key = `${prefix}${SEARCH_PARAM_TO_SPEC[selectedSpecs[0]]}`;
    const cutOffRating = rewards?.[key];
    const uniqueSpots = spotWithNoAlts?.[key];
    const totalSpots = stats?.cutoffs?.spotCounts?.[key];
    const predictedCutoff = predictions?.[key];
    const title =
      bracket === "shuffle" ? CUT_OFF_TITLES.shuffle : CUT_OFF_TITLES.blitz;

    return (
      <div className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-amber-500/20 bg-slate-900/40 px-4 py-2 backdrop-blur-md transition-all hover:border-amber-500/40 hover:bg-slate-900/60 sm:px-5">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent opacity-50 transition-opacity group-hover:opacity-70" />

        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20 transition-all group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]">
          <img
            className="h-5 w-5 drop-shadow-md"
            src={getSeasonRankImageFromRating(0, true)}
            alt="Rank 1"
          />
        </div>

        <div className="relative flex flex-col justify-center">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500/90">
            {specName} {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold leading-none text-amber-100 drop-shadow-sm sm:text-xl">
              {cutOffRating}
            </span>
            {predictedCutoff !== undefined &&
              predictedCutoff !== cutOffRating && (
                <span className="text-[10px] font-medium text-amber-500/60">
                  (Pred: {predictedCutoff})
                </span>
              )}
          </div>
        </div>

        {(totalSpots !== undefined || uniqueSpots !== undefined) && (
          <div className="relative ml-auto hidden items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 sm:flex">
            <span className="text-xs font-semibold text-amber-300">
              {totalSpots !== undefined && <>{totalSpots} spots</>}
              {totalSpots !== undefined && uniqueSpots !== undefined && (
                <span className="mx-1 text-amber-500/50">•</span>
              )}
              {uniqueSpots !== undefined && <>{uniqueSpots} uniq</>}
            </span>
            <Tooltip
              title="Unique spots means unique per Battle.net account (no alts counted)"
              arrow
              placement="top"
            >
              <span className="relative inline-flex cursor-help">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-amber-400/70 hover:text-amber-300"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            </Tooltip>
          </div>
        )}
      </div>
    );
  } else if (
    (bracket === "shuffle" || bracket === "blitz") &&
    selectedSpecs.length === 0
  ) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 px-4 py-2.5 backdrop-blur-sm transition-colors hover:border-slate-700/60 hover:bg-slate-900/60">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80 ring-1 ring-slate-700/50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-400"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        </div>
        <span className="text-xs font-medium text-slate-400">
          Select a specialization to view cutoff
        </span>
      </div>
    );
  } else if (
    (bracket === "shuffle" || bracket === "blitz") &&
    selectedSpecs.length > 1
  ) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-900/30 bg-amber-900/10 px-4 py-2.5 backdrop-blur-sm transition-colors hover:bg-amber-900/20">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-900/20 ring-1 ring-amber-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-500"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <span className="text-xs font-medium text-amber-500">
          Select a single spec for cutoff data
        </span>
      </div>
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
  return <CutOffText stats={stats} bracket={bracket} />;
};

export default CutOffRating;
