import { Avatar, Chip, IconButton } from "@mui/material";
import { EuIcon, UsIcon } from "@/components/IIcons";
import { REGION } from "@/constants/region";

import {
  bracketToColor,
  getAltProfileUrl,
  getClassIcon,
  getClassNameColor,
  getSeasonRankImageFromRating,
  getSpecIcon,
  getRaceIcon,
} from "@/utils/table";
import { CLASS_AND_SPECS } from "@/constants/filterSchema";

import type { Alt, Bracket, TableColumn } from "@/types";
import { nickNameLenOnMobile } from "@/utils/common";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { keyframes, styled } from "@mui/material/styles";

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 235, 59, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(255, 235, 59, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(255, 235, 59, 0);
  }
`;

const PulsingDot = styled(FiberManualRecordIcon)(({ theme }) => ({
  color: "#FBC02D", // Yellow-ish
  animation: `${pulse} 1.5s infinite`,
  borderRadius: "50%",
}));

type UpdateStatus = "pending" | "success" | "error" | undefined;

interface Params {
  record: Alt;
  soloBracket: string;
}

const renderName = ({ record: alt }: Params, isMobile: boolean) => {
  const realm = alt.realm;
  const url = getAltProfileUrl(alt);
  let name = alt.name;
  if (isMobile) {
    const max = nickNameLenOnMobile();
    name = `${name.substring(0, max)}`;
  }
  const classImg = getClassIcon(alt.class);
  const raceImg = getRaceIcon(alt.gender, alt.race);
  const classColor = getClassNameColor(alt.class);

  return (
    <div className="pl-1 flex items-center">
      <a className="no-underline flex items-center group" href={url}>
        {!isMobile && (
          <div className="relative mr-3 w-9 h-9">
            <img
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-sm border border-slate-700/50 z-10"
              src={classImg}
              alt="class"
            />
            <img
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-slate-900 z-20 shadow-sm"
              src={raceImg}
              alt="race"
            />
          </div>
        )}
        <div className="flex flex-col justify-center">
          <span
            className="text-[0.93rem] font-bold leading-none tracking-wide group-hover:brightness-125 transition-all drop-shadow-sm"
            style={{ color: classColor }}
          >
            {name}
          </span>
          {!isMobile && (
            <span className="text-[0.7rem] uppercase tracking-wider text-slate-400 font-semibold leading-none mt-[3px] opacity-70">
              {realm}
            </span>
          )}
        </div>
      </a>
    </div>
  );
};

const bracketTypeTitleMap = {
  "2v2": "ARENA_2v2",
  "3v3": "ARENA_3v3",
  rbg: "BATTLEGROUNDS",
};

const renderBracket = (
  { record: alt }: Params,
  bracketName: keyof typeof bracketTypeTitleMap
) => {
  const bracket = alt?.brackets?.find(
    (br) => br.bracket_type === bracketTypeTitleMap[bracketName]
  );

  if (!bracket || bracket.rating === 0) {
    return <div className="text-slate-600/50 font-medium text-sm pl-2">—</div>;
  }

  const { rating, is_rank_one_range } = bracket;
  const color = bracketToColor(bracket);
  const rankImg = getSeasonRankImageFromRating(rating, is_rank_one_range);

  return (
    <div className="flex items-center gap-2 pl-1">
      <img
        className="w-6 h-6 object-contain drop-shadow-sm"
        src={rankImg}
        alt="rank"
      />
      <span
        className="font-bold text-[0.95rem] tracking-wide tabular-nums"
        style={{ color: color, textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}
      >
        {rating}
      </span>
    </div>
  );
};

const SoloBracketPill = ({
  icon,
  rating,
  color,
}: {
  icon: string;
  rating: number;
  color: string;
}) => (
  <div
    className="flex items-center gap-2 pl-[3px] pr-3 py-[3px] rounded-full border bg-slate-900/40 hover:bg-slate-800/60 transition-all shadow-sm"
    style={{ borderColor: color }}
  >
    <img src={icon} alt="spec" className="w-6 h-6 rounded-full shadow-sm" />
    <span
      className="font-bold text-[0.9rem] tracking-wide tabular-nums"
      style={{ color: color }}
    >
      {rating}
    </span>
  </div>
);

const renderSoloBracket = (
  soloBracket: string,
  { record: alt }: Params,
  limit: number,
  isMobile: boolean
) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[alt.class] as string[];
  if (!classAndSpec) return <></>;
  const sortedSpec = [...classAndSpec]
    .sort((a, b) => {
      const ratingA =
        alt?.brackets?.find(
          (bracket) =>
            bracket.bracket_type.includes(a) &&
            bracket.bracket_type.includes(soloBracket)
        )?.rating || 0;
      const ratingB =
        alt?.brackets?.find(
          (bracket) =>
            bracket.bracket_type.includes(b) &&
            bracket.bracket_type.includes(soloBracket)
        )?.rating || 0;
      return ratingA > ratingB ? -1 : 1;
    })
    .slice(0, limit);

  if (isMobile) {
    let max = 0;
    let spec = sortedSpec[0];
    let bracket: Bracket | null = null;
    sortedSpec.forEach((s) => {
      const altBracket = alt?.brackets?.find((b) => b.bracket_type.includes(s));
      if (altBracket?.rating && altBracket.rating > max) {
        max = altBracket.rating;
        bracket = altBracket;
        spec = s;
      }
    });

    if (!bracket) return <></>;
    const specIcon = getSpecIcon(`${spec} ${alt.class}` || "");
    const ratingColor = bracketToColor(bracket);

    return (
      <SoloBracketPill
        icon={specIcon}
        rating={(bracket as any).rating}
        color={ratingColor}
      />
    );
  }

  return (
    <div className="flex flex-nowrap gap-2">
      {sortedSpec.map((spec) => {
        const altBracket = alt?.brackets?.find(
          (b) =>
            b.bracket_type.includes(spec) &&
            b.bracket_type.includes(soloBracket)
        );
        if (!altBracket?.rating) return null;

        const specIcon = getSpecIcon(`${spec} ${alt.class}` || "");
        const ratingColor = bracketToColor(altBracket);

        return (
          <SoloBracketPill
            key={spec}
            icon={specIcon}
            rating={altBracket.rating}
            color={ratingColor}
          />
        );
      })}
    </div>
  );
};

const renderStatus = (
  { record: alt }: Params,
  statusMap?: Record<string, UpdateStatus>
) => {
  const status = statusMap ? statusMap[`${alt.name}-${alt.realm}`] : undefined;

  if (!status) return <div className="w-6 h-6" />; // Placeholder to keep alignment

  if (status === "pending") {
    return <PulsingDot className="!w-5 !h-5" />;
  }
  if (status === "success") {
    return <CheckCircleOutlineIcon className="text-green-500 !w-5 !h-5" />;
  }
  if (status === "error") {
    // Red cross for failure (HighlightOff matches CheckCircleOutline style)
    return <HighlightOffIcon className="text-red-500 !w-5 !h-5" />;
  }
  return <div className="w-6 h-6" />;
};

export const tableColumns = (
  isMobile: boolean,
  updateStatus?: Record<string, UpdateStatus>,
  showRegion: boolean = false,
  showLevel: boolean = false
): TableColumn[] => {
  const cols: TableColumn[] = [
    {
      field: "status",
      label: "",
      width: 50,
      render: (params: Params) => renderStatus(params, updateStatus),
    },
  ];

  if (showRegion) {
    cols.push({
      field: "region",
      label: "Region",
      render: ({ record }: Params) => (
        <div className="flex items-center pl-2">
          {record.region.toLowerCase() === "eu" && (
            <IconButton
              size="small"
              disableRipple
              sx={{
                p: 0,
                "&:hover": { bgcolor: "transparent" },
                cursor: "default",
              }}
            >
              <EuIcon />
            </IconButton>
          )}
          {record.region.toLowerCase() === "us" && (
            <IconButton
              size="small"
              disableRipple
              sx={{
                p: 0,
                "&:hover": { bgcolor: "transparent" },
                cursor: "default",
              }}
            >
              <UsIcon />
            </IconButton>
          )}
        </div>
      ),
    });
  }

  cols.push({
    field: "name",
    label: "Name",
    render: (params: Params) => renderName(params, isMobile),
  });

  if (showLevel) {
    cols.push({
      field: "level",
      label: "Level",
      render: ({ record }: Params) => (
        <span className="text-slate-300 font-medium pl-2">
          {record.level || 0}
        </span>
      ),
    });
  }

  cols.push(
    {
      field: "SHUFFLE",
      label: "Shuffle",
      render: (params: Params) =>
        renderSoloBracket("SHUFFLE", params, 3, isMobile),
    },
    {
      field: "BLITZ",
      label: "Blitz",
      render: (params: Params) =>
        renderSoloBracket("BLITZ", params, 1, isMobile),
    },
    {
      field: "ARENA_2v2",
      label: "2v2",
      render: (params: Params) => renderBracket(params, "2v2"),
    },
    {
      field: "ARENA_3v3",
      label: "3v3",
      render: (params: Params) => renderBracket(params, "3v3"),
    },
    {
      field: "BATTLEGROUNDS",
      label: "RBG",
      render: (params: Params) => renderBracket(params, "rbg"),
    }
  );

  return cols;
};
