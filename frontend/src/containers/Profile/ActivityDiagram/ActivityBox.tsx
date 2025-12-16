import { Tooltip } from "@mui/material";
import { gamesPlayedByActivityArray } from ".";
import { getSeasonForTimestamp } from "@/constants/seasons";

/**
 * ActivityBox
 * @param intensity 0-4 (0 = no activity, 4 = high activity)
 * @returns colored box
 */

export const ActivityBox = ({
  maxIntensity = 5,
  activity = [],
  date = undefined,
  year = undefined,
  selectedYear = undefined,
  currentDate = undefined,
}) => {
  let hoverText;
  let intensity = 0;
  if (selectedYear === currentDate || year === selectedYear) {
    if (activity !== undefined && date !== undefined) {
      const day = date.getDate();
      const suffix = [11, 12, 13].includes(day % 100)
        ? "th"
        : { 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th";
      const monthAndDate =
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        suffix;
      let totalArenaGames;
      if (activity.length > 0) {
        totalArenaGames = gamesPlayedByActivityArray(activity);
      } else {
        totalArenaGames = 0;
      }
      // Get season info for tooltip
      const season = getSeasonForTimestamp(date.getTime());
      const seasonInfo = season ? ` • ${season.shortName}` : "";
      hoverText = `${totalArenaGames} games on ${monthAndDate}, ${year}${seasonInfo}`;
    }
    // Enhanced color palette with better gradients - darker to brighter
    const colors = {
      0: "bg-slate-800/60",
      1: "bg-sky-600/50",
      2: "bg-sky-500/70",
      3: "bg-sky-400/85",
      4: "bg-sky-400",
    };
    intensity = Math.min(
      maxIntensity,
      Math.round((gamesPlayedByActivityArray(activity) / maxIntensity) * 4)
    );
    if (intensity === 0 && gamesPlayedByActivityArray(activity) !== 0) {
      intensity = 1;
    }
    let className = `mx-[1px] my-[1px] w-[10px] h-[10px] ${colors[intensity]} rounded-sm transition-all duration-200 hover:scale-125 hover:brightness-125`;
    return (
      <Tooltip
        title={hoverText}
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "rgba(10, 15, 24, 0.95)",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              borderRadius: "8px",
              fontSize: "12px",
              padding: "6px 10px",
            },
          },
        }}
      >
        <div className={className}></div>
      </Tooltip>
    );
  }
  hoverText = "No activity";
  if (selectedYear !== currentDate && year !== 0) {
    return (
      <Tooltip
        title={hoverText}
        placement="top"
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "rgba(10, 15, 24, 0.95)",
              border: "1px solid rgba(96, 165, 250, 0.3)",
              borderRadius: "8px",
              fontSize: "12px",
              padding: "6px 10px",
            },
          },
        }}
      >
        <div className="mx-[1px] my-[1px] w-[10px] h-[10px] bg-slate-800/60 rounded-sm"></div>
      </Tooltip>
    );
  }
};

export default ActivityBox;
