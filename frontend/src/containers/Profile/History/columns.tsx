import moment from "moment-timezone";

import CharacterChip from "./CharacterChip";
import {
  getDiffCell,
  getRankDiffColor,
  getWonAndLossColors,
  getDiffColor,
  getSpecIcon,
} from "@/utils/table";

import type { HistoryRow, Player, TableColumn } from "@/types";

interface IParams {
  record: HistoryRow;
}

const renderRank = ({ record }: IParams, isMobile: boolean) => {
  const pos = record.RANK.character?.pos ?? record.RANK.rank;
  const rankDiff = record.RANK.diff.rank_diff;
  return (
    <div className="flex">
      {isMobile && <span className="text-base font-light">{`#${pos}`}</span>}
      {!isMobile && <span className="text-base font-light">{`#${pos}`}</span>}
      {!isMobile && Number.isInteger(rankDiff) && (
        <span
          className="text-base font-light ml-1"
          style={{ color: getRankDiffColor(rankDiff) }}
        >
          {getDiffCell(rankDiff)}
        </span>
      )}
    </div>
  );
};

const renderWinAndLoss = ({ record }: IParams) => {
  const won = record.WL.won;
  const loss = record.WL.lost;
  const { wonColor, lossColor } = getWonAndLossColors(won, loss);

  return (
    <div className="flex px-1">
      <span
        className="text-base font-light mr-1"
        style={{ color: wonColor }}
      >{`${won} `}</span>
      <span className="text-base font-light">{` / `}</span>
      <span className="text-base font-light ml-1" style={{ color: lossColor }}>
        {loss}
      </span>
    </div>
  );
};

const renderRating = ({ record }: IParams) => {
  const rating = record.RATING.character?.rating ?? record.RATING.rating;
  const ratingDiff = record.RATING.diff.rating_diff;
  return (
    <div className="flex px-0">
      <span className="text-base font-light mr-2">{rating}</span>
      {Number.isInteger(ratingDiff) && (
        <span
          className="text-base font-light"
          style={{ color: getDiffColor(ratingDiff) }}
        >
          {getDiffCell(ratingDiff)}
        </span>
      )}
    </div>
  );
};

const renderWWho = ({ record }: IParams, player: Player, isMobile: boolean) => {
  return (
    <div className="flex md:gap-2">
      {record.WWHO.map((who) => (
        <CharacterChip char={who} region={player.region} show_nick />
      ))}
    </div>
  );
};

const bracketTitleMap = {
  ARENA_2v2: "2v2",
  ARENA_3v3: "3v3",
  BATTLEGROUNDS: "RBG",
};

const renderSpec = ({ record }: IParams) => {
  const specIcon = getSpecIcon(`${record.RANK.character?.full_spec}` || "");

  return (
    <div className="flex md:gap-2 px-1">
      {record.bracket_type.includes("SHUFFLE") ? (
        <img
          className=" h-7 w-7 rounded border border-solid border-[#37415180]"
          src={specIcon}
          alt="spec icon"
        />
      ) : (
        <span>{bracketTitleMap[record.bracket_type]}</span>
      )}
    </div>
  );
};

const renderServerTime = (
  { record }: IParams,
  player: Player,
  isMobile: boolean
) => {
  const getDate = (ts: number) => {
    const tz = player.region === "eu" ? "Europe/Paris" : "America/Chicago";
    const time = moment
      .unix(ts / 1000)
      .utc()
      .tz(tz);
    if (isMobile) {
      return time.format("MMM DD, YYYY - hh A");
    } else {
      return time.format("MMM DD, YYYY - hh:mm A");
    }
  };
  return (
    <span className="flex justify-center items-center">
      {getDate(record.timestamp)}
    </span>
  );
};

const shouldRenderWWho = (bracket: string, isMobile) => {
  if (isMobile || bracket === "all") {
    return false;
  }
  return ["all", "ARENA_2v2", "ARENA_3v3"].includes(bracket);
};

export const tableColumns = (
  player: Player,
  bracket: string,
  isMobile: boolean
): TableColumn[] => [
  {
    field: "rank",
    label: "Rank",
    sortable: false,
    render: (params: IParams) => renderRank(params, isMobile),
  },
  {
    field: "wl",
    label: "W/L",
    sortable: false,
    render: (params: IParams) => renderWinAndLoss(params),
  },
  {
    field: "rating",
    label: isMobile ? "RTG" : "Rating",
    sortable: false,
    render: (params: IParams) => renderRating(params),
  },
  ...(bracket === "all"
    ? [
        {
          field: "bracket_type",
          label: "Bracket",
          sortable: false,
          width: 10,
          render: (params: IParams) => renderSpec(params),
        },
      ]
    : []),
  ...(shouldRenderWWho(bracket, isMobile)
    ? [
        {
          field: "wwho",
          label: "With Who",
          sortable: false,
          render: (params: IParams) => renderWWho(params, player, isMobile),
        },
      ]
    : []),
  {
    field: "timestamp",
    label: isMobile ? "Time" : `Server Time ${player.region.toUpperCase()}`,
    render: (params: IParams) => renderServerTime(params, player, isMobile),
  },
];
