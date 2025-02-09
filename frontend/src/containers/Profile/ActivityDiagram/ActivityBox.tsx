import { Tooltip } from "@mui/material";
import { gamesPlayedByActivityArray } from ".";

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
}) => {
  let hoverText;
  let intensity = 0;
  if (selectedYear === new Date().getFullYear() || year === selectedYear || year === 0) {
    if (activity !== undefined && date !== undefined) {
      const monthAndDate =
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
        "th";
      let totalArenaGames;
      if (activity.length > 0) {
        totalArenaGames = gamesPlayedByActivityArray(activity);
      } else {
        totalArenaGames = 0;
      }
      hoverText = `${totalArenaGames} games on ${monthAndDate}`;
    } else {
      hoverText = `No activity`;
    }
    let colors = {
      0: "bg-gray-600",
      1: "bg-sky-300",
      2: "bg-sky-400",
      3: "bg-sky-600",
      4: "bg-sky-700",
    };
    if (date === undefined) {
      intensity = 0;
      return (
        <Tooltip title={hoverText} placement="top">
          <div></div>
        </Tooltip>
      );
    } else {
      intensity = Math.min(
        maxIntensity,
        Math.round((gamesPlayedByActivityArray(activity) / maxIntensity) * 4)
      );
      if (intensity === 0 && gamesPlayedByActivityArray(activity) !== 0) {
        intensity = 1;
      }
      let className = `ml-[1px] mr-[1px] mt-[2px] mb-[2px] w-[10px] h-[10px] ${colors[intensity]} rounded-[2px]}`;
      return (
        <Tooltip title={hoverText} placement="top">
          <div className={className}></div>
        </Tooltip>
      );
    }
  }
  hoverText = "No activity";
  return (
    <Tooltip title={hoverText} placement="top">
      <div className="ml-[1px] mr-[1px] mt-[2px] mb-[2px] w-[10px] h-[10px] bg-gray-600 rounded-[2px] "></div>
    </Tooltip>
  );
};

export default ActivityBox;
