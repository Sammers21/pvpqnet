import { useMemo } from "react";
import dayjs from "dayjs-ext";

import { Chip, LinearProgress, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  getSpecIcon,
  getWonAndLossColors,
  bracketToColor,
  getSeasonRankImageFromRating,
} from "@/utils/table";
import { CLASS_AND_SPECS } from "@/constants/filterSchema";
import type { Bracket, Player } from "@/types";

interface IProps {
  player: Player;
}

const arenaAndRbg = [
  { name: "ARENA_2v2", title: "2v2" },
  { name: "ARENA_3v3", title: "3v3" },
  { name: "BATTLEGROUNDS", title: "RBG" },
];

const PvpBracket = ({
  title,
  bracket,
  isZolo,
  zoloName,
  playerClass,
  hasFourSpecs,
}: {
  title?: string;
  bracket?: Bracket;
  isZolo?: boolean;
  zoloName?: string;
  playerClass?: string;
  hasFourSpecs: boolean;
}) => {
  const specIcon = useMemo(() => {
    if (!isZolo || !title) return;
    return getSpecIcon(`${title} ${playerClass}` || "");
  }, [title, isZolo, playerClass]);
  const ratingColor = useMemo(() => {
    if (!bracket) return "#ffffff";
    return bracketToColor(bracket);
  }, [bracket]);
  const stats = useMemo(() => {
    const won = bracket?.won || 0;
    const lost = bracket?.lost || 0;
    const rating = bracket?.rating || 0;
    const is_rank_one_range = bracket?.is_rank_one_range || false;
    const { wonColor, lossColor } = getWonAndLossColors(won, lost);
    const showWinRate = won > 0 || lost > 0;
    const winRate = ((won * 100) / (won + lost)).toFixed(2);
    const winRateColor = parseInt(winRate, 10) >= 50 ? "green" : "#ff0531";
    return {
      rating,
      is_rank_one_range,
      showWinRate,
      winRateColor,
      wonColor,
      lossColor,
      winRate,
    };
  }, [bracket]);
  const ratingImg = (
    <img
      className="w-7 h-7 md:w-11 md:h-11 md:mx-1"
      src={getSeasonRankImageFromRating(stats.rating, stats.is_rank_one_range)}
      alt="rating"
    />
  );
  return (
    <div
      className={`flex self-stretch flex-col items-center pr-2 ${
        hasFourSpecs ? "w-1/4" : "w-1/3"
      }`}
    >
      <div className="relative flex flex-col w-full h-full rounded-lg border pb-4 px-3 border-solid border-[#37415180] bg-[#030303e6]">
        <div className="flex flex-col w-full justify-start py-2">
          <div className="flex w-full justify-between items-center">
            {specIcon ? (
              <div className="flex flex-row items-center">
                <img
                  className="h-9 w-9 rounded border border-solid border-[#37415180]"
                  src={specIcon}
                  alt={title}
                />
                <span className="pl-2 text-base sm:text-2xl text-white">
                  {zoloName}
                </span>
              </div>
            ) : (
              <span className="text-base sm:text-3xl text-white">{title}</span>
            )}
            <div className="hidden sm:flex sm:flex-col rounded-lg absolute top-0 right-0 px-2 pt-2 bg-[#030303e6]">
              {bracket?.season_max_rating &&
              bracket.season_max_rating !== -1 &&
              bracket?.season_max_rating !== bracket?.max_rating ? (
                <Tooltip
                  placement="right"
                  title={`Season record achieved at ${dayjs(
                    bracket.season_max_rating_achieved_timestamp
                  ).format("MM.DD.YY")}`}
                >
                  <div className="flex gap-2 flex-row justify-center items-center text-[#60A5FACC]">
                    <span className="text-base">Season</span>
                    <span className="text-white text-xs sm:text-base flex items-center">
                      {bracket.season_max_rating}
                      <InfoOutlinedIcon
                        fontSize="small"
                        className="!ml-1 !w-4 !h-4"
                      />
                    </span>
                  </div>
                </Tooltip>
              ) : null}
              {bracket?.max_rating && bracket.max_rating !== -1 ? (
                <Tooltip
                  placement="right"
                  title={`Record achieved at ${dayjs(
                    bracket.max_rating_achieved_timestamp
                  ).format("MM.DD.YY")}`}
                >
                  <div className="flex gap-2 flex-row justify-center items-center text-[#60A5FACC]">
                    <span className="text-base">Record</span>
                    <span className="text-white text-xs sm:text-base flex items-center">
                      {bracket.max_rating}
                      <InfoOutlinedIcon
                        fontSize="small"
                        className="!ml-1 !w-4 !h-4"
                      />
                    </span>
                  </div>
                </Tooltip>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2 mt-1 pt-1 border-t border-solid border-[#37415180]">
            {/* {ratingImg} */}
            <span
              className="flex flex-row items-center gap-1 text-2xl md:text-4xl font-semibold"
              style={{ color: ratingColor }}
            >
              {ratingImg}
              {stats.rating}
            </span>
            {bracket?.rank && bracket.rank !== -1 ? (
              <div className="hidden sm:flex items-center justify-between relative">
                <Chip
                  className="!text-xs md:!text-sm"
                  label={`#${bracket.rank}`}
                  size="small"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="pb-1 gap-0 sm:gap-2 flex sm:flex-row flex-col text-[#60A5FACC] text-sm">
          <div className="flex text-sm md:text-base">
            <span className="text-[#008000]">{bracket?.won || 0}</span>
            <span className="text-[#374151E6] mx-[2px]">/</span>
            <span className="text-[#ff0000]">{bracket?.lost || 0}</span>
          </div>

          <div className="flex pl-0 sm:pl-2 sm:border-l border-solid border-[#37415180]">
            <span
              className="text-sm md:text-base text-[#4B5563]"
              style={{ opacity: stats.showWinRate ? 1 : 0 }}
            >
              {stats.showWinRate ? `${stats.winRate}%` : "-"}
            </span>
          </div>
        </div>
        <LinearProgress
          variant="determinate"
          value={parseInt(stats.winRate, 10)}
          sx={{
            "& .MuiLinearProgress-bar": { backgroundColor: "#008000" },
            "&.MuiLinearProgress-root": { backgroundColor: "#ff0000" },
          }}
        />
      </div>
    </div>
  );
};

const PvpBrackets = ({ player }: IProps) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[player.class] as string[];
  const hasFourSpecs = classAndSpec.length === 4;
  const shuffleBrackets = classAndSpec
    .map((spec) => {
      const bracket = player?.brackets?.find(
        ({ bracket_type }) =>
          bracket_type.includes(spec) && bracket_type.includes("SHUFFLE")
      );
      const noRender =
        player.class === "Druid" && spec === "Guardian" && !bracket;
      return { bracket, spec, noRender };
    })
    .sort((a, b) => (b.bracket?.rating ?? 0) - (a.bracket?.rating ?? 0));
  const blitzBrackets = classAndSpec
    .map((spec) => {
      const bracket = player?.brackets?.find(
        ({ bracket_type }) =>
          bracket_type.includes(spec) && bracket_type.includes("BLITZ")
      );
      const noRender =
        player.class === "Druid" && spec === "Guardian" && !bracket;
      return { bracket, spec, noRender };
    })
    .sort((a, b) => (b.bracket?.rating ?? 0) - (a.bracket?.rating ?? 0));
  const hasDruidTank =
    player.class === "Druid" &&
    !!(player?.brackets || []).find((b) => b.bracket_type.includes("Guardian"));
  return (
    <div className="flex gap-2 justify-start flex-col">
      <div className="flex flex-nowrap flex-row items-stretch justify-start">
        {arenaAndRbg.map(({ title, name }) => {
          const playerBracket = (player?.brackets || []).find(
            (b) => b.bracket_type === name
          );
          return (
            <PvpBracket
              key={name}
              title={title}
              bracket={playerBracket}
              hasFourSpecs={false}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap justify-start">
        {shuffleBrackets.map(({ bracket, spec, noRender }) => {
          if (noRender) return null;
          return (
            <PvpBracket
              key={spec}
              bracket={bracket}
              title={spec}
              isZolo={true}
              zoloName={"Shuffle"}
              playerClass={player.class}
              hasFourSpecs={hasFourSpecs && hasDruidTank}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap justify-start">
        {blitzBrackets.map(({ bracket, spec, noRender }) => {
          if (noRender) return null;
          return (
            <PvpBracket
              key={spec}
              bracket={bracket}
              title={spec}
              isZolo={true}
              zoloName={"Blitz"}
              playerClass={player.class}
              hasFourSpecs={hasFourSpecs && hasDruidTank}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PvpBrackets;
