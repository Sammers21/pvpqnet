import {
  getProfileUrl,
  getClassNameColor,
  getRankDiffColor,
  getRealmColor,
  getDiffColor,
  getDiffCell,
  getDetaisImages,
  getWinRate,
  getWonAndLossColors,
  getRatingColor,
  getSeasonRankImageFromRating,
} from "@/utils/table";
import type { IActivityRecord } from "@/types";
import { nickNameLenOnMobile } from "@/utils/common";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
const getTableColumns = (
  activity: string,
  isMobile: boolean,
  region: string
): any[] => {
  const rank = {
    field: "pos",
    label: "RANK",
    render: ({ record }: { record: IActivityRecord }) => {
      const pos = record?.character?.pos || record?.pos;
      var rankDiff = record?.diff?.rank_diff;
      var arrow
      if (rankDiff < 0) {
        arrow = <ArrowUpwardIcon className="w-4 h-4" style={{ color: getRankDiffColor(rankDiff) }} />
      } else {
        arrow = <ArrowDownwardIcon className="w-4 h-4" style={{ color: getRankDiffColor(rankDiff) }} />
      }
      var unsignRankDiff = Math.abs(rankDiff)
      return (
        <div className="flex">
          {isMobile && (
            <span
              className="text-base font-light"
              style={{ color: getRankDiffColor(rankDiff) }}
            >{`#${pos}`}</span>
          )}
          {!isMobile && (
            <span className="text-base font-light">{`#${pos}`}</span>
          )}
          {!isMobile && Number.isInteger(rankDiff) && (
            <span
              className="text-base font-light ml-1"
              style={{ color: getRankDiffColor(rankDiff) }}
            >
              {arrow}
              {/* {getDiffCell(rankDiff)} */}
              {unsignRankDiff}
            </span>
          )}
        </div>
      );
    },
  };

  const details = {
    field: "details",
    label: isMobile ? "DTLS" : "DETAILS",
    render: ({ record }: { record: IActivityRecord }) => {
      const wowClass = record?.character?.class || record?.class;
      const wowSpec = record?.character?.full_spec || record?.full_spec;
      const wowRace = record?.character?.race || record?.race;
      const wowGender = record?.character?.gender || record?.gender;

      const icons = getDetaisImages({ wowClass, wowSpec, wowRace, wowGender });

      return (
        <div className="flex">
          {window.innerWidth > 600 && (
            <img
              className="mr-1 h-6 w-6 rounded border border-solid border-[#37415180]"
              src={icons.raceIcon}
              alt="race icon"
            />
          )}
          {window.innerWidth > 700 && (
            <img
              className="mr-1 h-6 w-6 rounded border border-solid border-[#37415180]"
              src={icons.classIcon}
              alt="class icon"
            />
          )}

          <img
            className=" h-6 w-6 rounded border border-solid border-[#37415180]"
            src={icons.specIcon}
            alt="spec icon"
          />
        </div>
      );
    },
  };

  const name = {
    field: "name",
    label: "NAME",
    render: ({ record }: { record: IActivityRecord }) => {
      const wowClass = record?.character?.class || record?.class;
      const url = getProfileUrl(record, region);

      let name = record?.character?.name || record?.name;
      if (isMobile) {
        const max = nickNameLenOnMobile();
        name = `${name.substring(0, max)}`;
      }

      return (
        <a
          className="text-base no-underline"
          href={url}
          style={{ color: getClassNameColor(wowClass) }}
        >
          {name}
        </a>
      );
    },
  };

  const realm = {
    field: "realm",
    label: "REALM",
    render: ({ record }: { record: IActivityRecord }) => {
      const fraction = record?.character?.fraction || record?.fraction;
      const realm = record?.character?.realm || record?.realm;

      return (
        <span className="text-base" style={{ color: getRealmColor(fraction) }}>
          {realm}
        </span>
      );
    },
  };

  const wonLost = {
    field: "stats",
    label: isMobile ? "W/L" : "WON / LOST",
    render: ({ record }: { record: IActivityRecord }) => {
      const winRate = getWinRate(record.wins, record.losses);

      const won = record?.diff?.won ?? record?.wins;
      const loss = record?.diff?.lost ?? record?.losses;
      const { wonColor, lossColor } = getWonAndLossColors(won, loss);

      return (
        <div className="flex">
          <span
            className="text-base font-light mr-1"
            style={{ color: wonColor }}
          >{`${won} `}</span>
          <span className="text-base font-light">{` / `}</span>
          <span
            className="text-base font-light ml-1"
            style={{ color: lossColor }}
          >
            {loss}
          </span>

          {winRate && (
            <span className="text-[#4B5563] mt-0.5 ml-2 mr-2 font-light text-sm">
              {winRate}
            </span>
          )}
        </div>
      );
    },
  };

  const rating = {
    field: "rating",
    label: "RATING",
    render: ({ record }: { record: IActivityRecord }) => {
      const rating = record?.character?.rating ?? record?.rating;
      const ratingColor = getRatingColor(
        record?.character?.in_cutoff ?? record?.in_cutoff
      );
      const ratingDiff = record?.diff?.rating_diff;
      const ratingImg = (
        <img
          className="w-6 h-6 mx-1"
          src={getSeasonRankImageFromRating(
            rating,
            record?.character?.in_cutoff ?? record?.in_cutoff
          )}
          alt="rating"
        />
      );
      return (
        <div className="flex">
          {!isMobile && ratingImg}
          <span
            className="text-base font-light mr-2"
            style={{ color: ratingColor }}
          >
            {rating}
          </span>
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
    },
  };

  const colums = isMobile
    ? [rank, details, name, wonLost, rating]
    : [rank, details, name, realm, wonLost, rating];

  const lastSeenColumn = {
    field: "lastSeen",
    label: isMobile ? "LS" : "LAST SEEN",
    render: ({ record }: { record: IActivityRecord }) => {
      if (!record?.diff?.last_seen) return <></>;
      const split = record.diff.last_seen.split(" ");
      const content = isMobile
        ? `${split[0]} ${split[1].charAt(0)}.`
        : record.diff.last_seen;

      return <span className="text-base">{content}</span>;
    },
  };

  return activity === "activity" ? [...colums, lastSeenColumn] : colums;
};

export default getTableColumns;
