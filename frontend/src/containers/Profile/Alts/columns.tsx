import { Avatar, Chip } from "@mui/material";

import {
  getAltProfileUrl,
  getClassNameColor,
  getSpecIcon,
  bracketToColor,
  getSeasonRankImageFromRating,
  getClassIcon,
} from "@/utils/table";
import { CLASS_AND_SPECS } from "@/constants/filterSchema";

import type { Alt, Bracket, TableColumn } from "@/types";
import { MINIMUM_NICKNAME_LENGTH, nickNameLenOnMobile } from "@/utils/common";

interface IParams {
  record: Alt;
}

const renderName = ({ record: alt }: IParams, isMobile: boolean) => {
  const realm = alt.realm;
  const url = getAltProfileUrl(alt);
  let name = alt.name;
  if (isMobile) {
    const max = nickNameLenOnMobile();
    name = `${name.substring(0, max)}`;
  }
  const classImg = getClassIcon(alt.class);
  return (
    <div className="pl-1 flex items-start">
      <span color={getClassNameColor(alt.class)}>
        <a
          className="text-base no-underline"
          href={url}
          style={{ color: getClassNameColor(alt.class) }}
        >
          <div className="flex items-start">
            {!isMobile && (
              <img className="w-6 h-6 mr-2" src={classImg} alt="class" />
            )}
            {name}
            {!isMobile && `-${realm}`}
          </div>
        </a>
      </span>
    </div>
  );
};

const bracketTypeTitleMap = {
  "2v2": "ARENA_2v2",
  "3v3": "ARENA_3v3",
  rbg: "BATTLEGROUNDS",
};

const renderBracket = (
  { record: alt }: IParams,
  bracketName: keyof typeof bracketTypeTitleMap
) => {
  const bracket = alt?.brackets?.find(
    (br) => br.bracket_type === bracketTypeTitleMap[bracketName]
  );
  var rating;
  var is_rank_one_range;
  var color;

  if (!bracket) {
    rating = 0;
    is_rank_one_range = false;
    color = "#FFFFFF";
  } else {
    rating = bracket.rating;
    is_rank_one_range = bracket.is_rank_one_range;
    color = bracketToColor(bracket);
  }
  return (
    <div className="flex">
      <img
        className="w-5 h-5 mx-05"
        src={getSeasonRankImageFromRating(rating, is_rank_one_range)}
        alt="rating"
      />
      <span style={{ color: color }}>{rating}</span>
    </div>
  );
};

const renderShuffle = ({ record: alt }: IParams, isMobile: boolean) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[alt.class] as string[];

  const sortedSpec = [...classAndSpec]
    .sort((a, b) => {
      const ratingA =
        alt?.brackets?.find((bracket) => bracket.bracket_type.includes(a))
          ?.rating || 0;
      const ratingB =
        alt?.brackets?.find((bracket) => bracket.bracket_type.includes(b))
          ?.rating || 0;
      return ratingA > ratingB ? -1 : 1;
    })
    .slice(0, 3);

  if (isMobile) {
    let max = 0;
    let spec = sortedSpec[0];
    let bracket: Bracket | null = null;

    sortedSpec.forEach((spec) => {
      const altBracket = alt?.brackets?.find((b) =>
        b.bracket_type.includes(spec)
      );
      if (altBracket?.rating && altBracket.rating > max) {
        max = altBracket.rating;
        bracket = altBracket;
      }
    });
    if (!bracket) return <></>;

    const specIcon = getSpecIcon(`${spec} ${alt.class}` || "");
    const ratingColor = bracketToColor(bracket);
    return (
      <Chip
        avatar={<Avatar alt="class" src={specIcon} />}
        label={(bracket as any).rating}
        variant="outlined"
        style={{ color: ratingColor, borderColor: ratingColor }}
      />
    );
  }
  return (
    <div className="flex md:gap-2">
      {sortedSpec.map((spec) => {
        const altBracket = alt?.brackets?.find((b) =>
          b.bracket_type.includes(spec)
        );
        if (!altBracket?.rating) return <></>;

        const specIcon = getSpecIcon(`${spec} ${alt.class}` || "");
        const ratingColor = bracketToColor(altBracket);
        return (
          <Chip
            avatar={<Avatar alt="class" src={specIcon} />}
            label={altBracket?.rating}
            variant="outlined"
            style={{ color: ratingColor, borderColor: ratingColor }}
          />
        );
      })}
    </div>
  );
};

export const tableColumns = (isMobile: boolean): TableColumn[] => [
  {
    field: "name",
    label: "Name",
    render: (params: IParams) => renderName(params, isMobile),
  },
  {
    field: "SHUFFLE",
    label: "Shuffle",
    render: (params: IParams) => renderShuffle(params, isMobile),
  },
  {
    field: "ARENA_2v2",
    label: "2v2",
    render: (params: IParams) => renderBracket(params, "2v2"),
  },
  {
    field: "ARENA_3v3",
    label: "3v3",
    render: (params: IParams) => renderBracket(params, "3v3"),
  },
  {
    field: "BATTLEGROUNDS",
    label: "RBG",
    render: (params: IParams) => renderBracket(params, "rbg"),
  },
];
