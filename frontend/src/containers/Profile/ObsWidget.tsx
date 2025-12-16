import { getProfile } from "@/services/stats.service";
import { Player } from "@/types";
import { Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { baseUrl } from "@/config";
import { groupBy } from "lodash";
import {
  DPS_SPECS,
  HEAL_SPECS,
  TANK_SPECS,
  CLASS_AND_SPECS,
} from "@/constants/filterSchema";
import { SpecChip } from "./Alts/SpecChip";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getSpecIcon } from "@/utils/table";
import { getCurrentSeason, isTimestampInSeason } from "@/constants/seasons";

function getSearchParamOrDefault(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: string
) {
  return searchParams.get(key) ?? defaultValue;
}

function getStyle(searchParams: URLSearchParams) {
  return getSearchParamOrDefault(searchParams, "style", "simple-text");
}

function getLayout(searchParams: URLSearchParams) {
  return getSearchParamOrDefault(searchParams, "layout", "vertical");
}

function getRole(searchParams: URLSearchParams) {
  return getSearchParamOrDefault(searchParams, "role", "all");
}

function getNoLogo(searchParams: URLSearchParams) {
  return getSearchParamOrDefault(searchParams, "nologo", "false") === "true";
}

function getLimit(searchParams: URLSearchParams) {
  return parseInt(getSearchParamOrDefault(searchParams, "limit", "10"));
}

function getAlign(searchParams: URLSearchParams) {
  return getSearchParamOrDefault(searchParams, "align", "center");
}

function getCustomText(searchParams: URLSearchParams) {
  return getSearchParamOrDefault(searchParams, "customText", "");
}

function getMarkCompleted(searchParams: URLSearchParams) {
  const param = getSearchParamOrDefault(searchParams, "markcompleted", "");
  if (!param) return [];
  return param.split(",").map((s) => s.trim().toLowerCase().replace(/\s/g, ""));
}

export const ObsWidget = () => {
  let { region, realm, name } = useParams();
  const [searchParams, _] = useSearchParams();
  const [player, setPlayer] = useState<Player | null>(null);
  const [fullCharList, setFullCharList] = useState<Player[] | null>(null);
  const style = getStyle(searchParams);
  const layout = getLayout(searchParams);
  const role = getRole(searchParams);
  const nologo = getNoLogo(searchParams);
  const limit = getLimit(searchParams);
  const align = getAlign(searchParams);
  const customText = getCustomText(searchParams);
  const markCompletedSpecs = getMarkCompleted(searchParams);
  useEffect(() => {
    document.title = `OBS Widget - ${name}-${realm} on ${region?.toUpperCase()}`;
    loadPlayerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, realm, name]);

  useEffect(() => {
    if (style === "trille-top100") {
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "transparent";
      return () => {
        document.body.style.backgroundImage = "";
        document.body.style.backgroundColor = "";
      };
    }
  }, [style]);

  async function loadPlayerData() {
    const profile = await getProfile(region, realm, name);
    const { player: data } = profile;
    setPlayer(data);
    const charList = data?.alts;
    charList?.push(data);
    setFullCharList(charList);
  }
  const specAndBracket = fullCharList?.flatMap((char) => {
    return char.brackets
      .filter((bracket) => {
        return bracket.bracket_type.startsWith("SHUFFLE");
      })
      .map((bracket) => {
        return {
          full_spec: bracket.bracket_type.split("-")[1] + " " + char.class,
          is_rank_one_range: bracket.is_rank_one_range,
          bracket: bracket,
          rating: bracket.rating,
          rank: bracket.rank,
        };
      });
  });
  const grouped = groupBy(specAndBracket, "full_spec");
  const specAndMaxShuffle = Object.keys(grouped)
    .map((key) => {
      return grouped[key].sort((a, b) => {
        return b.rating - a.rating;
      })[0];
    })
    .sort((a, b) => {
      return b.rating - a.rating;
    })
    .filter((spec) => {
      if (style === "trille-top100") {
        return !TANK_SPECS.includes(spec.full_spec);
      } else if (role === "healer") {
        return HEAL_SPECS.includes(spec.full_spec);
      } else if (role === "dps") {
        return DPS_SPECS.includes(spec.full_spec);
      } else {
        return true;
      }
    })
    .slice(0, style === "trille-top100" ? 100 : limit);

  let progressStats = { total: 0, completed: 0 };

  let flex;
  if (layout === "horizontal") {
    flex = "flex-row";
  } else if (layout === "vertical") {
    flex = "flex-col";
  } else {
    flex = "flex-col";
  }
  let contentList;
  let alignCss = "items-center";
  if (align === "left") {
    alignCss = "items-start";
  } else if (align === "right") {
    alignCss = "items-end";
  } else {
    alignCss = "items-center";
  }
  if (style === "simple-text") {
    contentList = specAndMaxShuffle?.map((alt) => {
      return (
        <Typography variant="h6">
          {alt.full_spec} - #{alt.rank}
        </Typography>
      );
    });
  } else if (style === "chips-ranks") {
    contentList = specAndMaxShuffle?.map((alt) => {
      return (
        <div>
          <SpecChip
            fullSpec={alt.full_spec}
            bracket={alt.bracket}
            label={`#` + alt.rank}
          />
        </div>
      );
    });
  } else if (style === "chips-ranks-rating") {
    contentList = specAndMaxShuffle?.map((alt) => {
      let label;
      if (alt.rank < 1) {
        label = alt.rating;
      } else {
        label = `#` + alt.rank + ` - ` + alt.rating;
      }
      return (
        <div>
          <SpecChip
            fullSpec={alt.full_spec}
            bracket={alt.bracket}
            label={label}
          />
        </div>
      );
    });
  } else if (style === "trille-top100") {
    const classes = Object.keys(CLASS_AND_SPECS);

    // Calculate progress
    classes.forEach((className) => {
      const specs = CLASS_AND_SPECS[className as keyof typeof CLASS_AND_SPECS];
      specs.forEach((specName) => {
        const fullSpecName = `${specName} ${className}`;
        if (
          !TANK_SPECS.includes(fullSpecName) &&
          fullSpecName !== "Blood Death Knight"
        ) {
          progressStats.total++;
          const specData = specAndMaxShuffle?.find(
            (s) => s.full_spec === fullSpecName
          );

          const history = specData?.bracket?.gaming_history?.history || [];
          const currentSeason = getCurrentSeason();
          const isHistoryCompletedThisSeason = history.some((entry) => {
            const rank = entry.rank || entry.character?.pos || 0;
            return (
              rank > 0 &&
              rank <= 100 &&
              entry.diff &&
              isTimestampInSeason(entry.diff.timestamp, currentSeason)
            );
          });

          if (
            (specData && specData.rank > 0 && specData.rank <= 100) ||
            isHistoryCompletedThisSeason ||
            markCompletedSpecs.includes(
              fullSpecName.toLowerCase().replace(/\s/g, "")
            )
          ) {
            progressStats.completed++;
          }
        }
      });
    });

    contentList = classes.flatMap((className) => {
      const specs = CLASS_AND_SPECS[className as keyof typeof CLASS_AND_SPECS];
      const validSpecs = specs.filter((specName) => {
        const fullSpecName = `${specName} ${className}`;
        return (
          !TANK_SPECS.includes(fullSpecName) &&
          fullSpecName !== "Blood Death Knight"
        );
      });

      if (validSpecs.length === 0) return [];

      return validSpecs.map((specName) => {
        const fullSpecName = `${specName} ${className}`;
        // Find the best bracket for this spec
        const specData = specAndMaxShuffle?.find(
          (s) => s.full_spec === fullSpecName
        );

        const currentRank = specData?.rank || 0;
        const currentRating = specData?.rating || 0;
        const history = specData?.bracket?.gaming_history?.history || [];

        const currentSeason = getCurrentSeason();

        // DEBUG LOGGING START
        console.groupCollapsed(`[Debug] ${fullSpecName}`);
        console.log(`Current Rank: ${currentRank}`);
        console.log(
          `Current Season: ${currentSeason.name} (Start: ${currentSeason.startDate})`
        );
        console.log(`History Entries: ${history.length}`);

        const isHistoryCompletedThisSeason = history.some((entry) => {
          const rank = entry.rank || entry.character?.pos || 0;
          const timestamp = entry.diff?.timestamp;
          const inSeason = timestamp
            ? isTimestampInSeason(timestamp, currentSeason)
            : false;
          const isRankQualifying = rank > 0 && rank <= 100;

          if (isRankQualifying && inSeason) {
            console.log(
              `✅ Found qualifying history entry: Rank ${rank} on ${new Date(
                timestamp!
              ).toLocaleDateString()}`
            );
            return true;
          }
          return false;
        });
        console.log(
          `isHistoryCompletedThisSeason: ${isHistoryCompletedThisSeason}`
        );

        const isMarkedManually = markCompletedSpecs.includes(
          fullSpecName.toLowerCase().replace(/\s/g, "")
        );
        console.log(`isMarkedManually: ${isMarkedManually}`);

        const isCompleted =
          (currentRank > 0 && currentRank <= 100) ||
          isHistoryCompletedThisSeason ||
          isMarkedManually;

        console.log(
          `FINAL RESULT: ${isCompleted ? "COMPLETED" : "INCOMPLETE"}`
        );
        console.groupEnd();
        // DEBUG LOGGING END

        const isHistoricallyCompleted =
          !isCompleted &&
          history.some((entry) => {
            const rank = entry.rank || entry.character?.pos || 0;
            return rank > 0 && rank <= 100;
          });

        let borderColor = "border-red-500";
        if (isCompleted) {
          borderColor = "border-green-500";
        } else if (isHistoricallyCompleted) {
          borderColor = "border-yellow-700"; // Brown-ish
        }

        const specIcon = getSpecIcon(fullSpecName);

        const textOutlineStyle = {
          textShadow:
            "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 2px black",
        };

        return (
          <div key={fullSpecName} className="flex items-center gap-1">
            <img
              src={specIcon}
              alt={fullSpecName}
              className={`w-9 h-9 rounded-full border-2 ${borderColor} shadow-md shadow-black`}
            />
            {isCompleted ? (
              <CheckCircleIcon
                className="text-green-500 drop-shadow-md"
                style={{ filter: "drop-shadow(1px 1px 1px black)" }}
              />
            ) : (
              <div className="flex flex-col leading-none">
                <span
                  className="font-bold text-white text-xs"
                  style={textOutlineStyle}
                >
                  {currentRank > 0 ? `#${currentRank}` : currentRating}
                </span>
                {currentRank > 0 && (
                  <span
                    className="text-[10px] text-gray-200 font-bold"
                    style={textOutlineStyle}
                  >
                    {currentRating}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      });
    });
  }

  const textOutlineStyle = {
    textShadow:
      "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 2px black",
  };

  if (style === "trille-top100") {
    const percentage =
      progressStats.total > 0
        ? Math.round((progressStats.completed / progressStats.total) * 100)
        : 0;

    return (
      <div className="min-h-screen bg-transparent p-2">
        <div className="flex justify-start items-center mb-3 w-full">
          <div className="flex flex-col items-start">
            <Typography
              variant="h6"
              className="text-white font-bold leading-none"
              style={textOutlineStyle}
            >
              Trille Top 100 Challenge
            </Typography>
            <div className="w-full flex items-center gap-2 mt-1">
              <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden border border-black shadow-md">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span
                className="text-xs text-white font-mono font-bold"
                style={textOutlineStyle}
              >
                {progressStats.completed}/{progressStats.total}
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-1 gap-y-1 px-1 w-fit">
          {contentList}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={` h-full flex ${flex} gap-1 ${alignCss} justify-center`}>
        {!nologo ? (
          <div>
            <Typography variant="h6">PVPQ.NET</Typography>
            <br />
          </div>
        ) : null}
        {customText === "" ? null : (
          <div>
            <Typography variant="h6">{customText}</Typography>
          </div>
        )}
        {contentList}
      </div>
    </div>
  );
};
