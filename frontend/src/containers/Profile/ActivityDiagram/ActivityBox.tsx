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
  currentDate = undefined
}) => {
  let hoverText;
  let intensity = 0;
  if (selectedYear === currentDate || year === selectedYear) {
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
      hoverText = `${totalArenaGames} games on ${monthAndDate} at ${year}`;
    }
    let colors = {
      0: "bg-gray-600",
      1: "bg-sky-300",
      2: "bg-sky-400",
      3: "bg-sky-600",
      4: "bg-sky-700",
    };
      intensity = Math.min(
        maxIntensity,
        Math.round((gamesPlayedByActivityArray(activity) / maxIntensity) * 4)
      );
      if (intensity === 0 && gamesPlayedByActivityArray(activity) !== 0) {
        intensity = 1;
      }
      let className = `ml-[1px] mr-[1px] mt-[2px] mb-[2px] w-[9px] h-[9px] ${colors[intensity]} rounded-[1px]`;
      return (
        <Tooltip title={hoverText} placement="top">
          <div className={className}></div>
        </Tooltip>
      );
  }
  hoverText = "No activity";
  if (selectedYear !== currentDate && year !== 0){
    return (
      <Tooltip title={hoverText} placement="top">
      <div className="ml-[1px] mr-[1px] mt-[2px] mb-[2px] w-[9px] h-[9px] bg-gray-600 rounded-[1px]"></div>
    </Tooltip>
  );
}
};

export default ActivityBox;
