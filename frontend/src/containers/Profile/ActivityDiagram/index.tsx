import { Player } from "@/types";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  Tooltip,
} from "@mui/material";
import { ActivityBox } from "./ActivityBox";
import { useState, useEffect, useMemo } from "react";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";

import RadarChart from "./RadarChart";
import { WOW_SEASONS, getSeasonForTimestamp } from "@/constants/seasons";
interface IProps {
  player: Player;
  year?: number;
}

const StyledTableCell = styled(TableCell)({
  padding: 0,
  border: 0,
  width: "10px",
  height: "10px",
});
function activityHistoryForPlayer(player: Player) {
  let totalPlayers = [player, ...player.alts];
  return totalPlayers
    .map((p) =>
      p.brackets.map((bracket) => bracket.gaming_history.history).flat()
    )
    .flat();
}
function getDayOfWeekRender(numberOfDay) {
  let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (numberOfDay % 2 === 0) {
    return (
      <StyledTableCell component="th" scope="row" size="small" align="left">
        {" "}
        <div className="pl-1 text-[#9CA3AF] text-xs"> {days[numberOfDay]}</div>
      </StyledTableCell>
    );
  } else {
    return <StyledTableCell component="th" scope="row" size="small" align="left" />;
  }
}

export function gamesPlayedByActivityArray(activityArray) {
  return activityArray
    .map((entry) => entry.diff.won + entry.diff.lost)
    .reduce((a, b) => a + b, 0);
}

const currentDate = new Date().toString();
const ActivityDiagram = ({ player }: IProps) => {
  const [selectedYear, setSelectedYear] = useState(currentDate);
  useEffect(() => {
    setSelectedYear(currentDate);
  }, [player]);
  let fullHistory = activityHistoryForPlayer(player);
  let weeks = [];
  var currentWeek = [];
  let dateAndActivity = {};
  let start;
  let end;
  let currentMonth;
  if (selectedYear !== currentDate) {
    start = new Date(Number(selectedYear), 0, 0, 0, 0, 0);
    end = new Date(new Date(Number(selectedYear), 11, 30).toString());
  } else {
    start = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    end = new Date();
    currentMonth = start.getMonth();
  }
  var loop = new Date(start);
  while (loop <= end) {
    let dt = loop.toLocaleDateString();
    let dayOfWeek = loop.getDay();
    currentWeek[dayOfWeek] = loop;
    if (dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    dateAndActivity[dt] = [];
    var newDate = loop.setDate(loop.getDate() + 1);
    loop = new Date(newDate);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }
  fullHistory.forEach((activity) => {
    let date = new Date(activity.diff.timestamp).toLocaleDateString();
    if (date in dateAndActivity) {
      dateAndActivity[date].push(activity);
    } else {
      dateAndActivity[date] = [activity];
    }
  });
  let weekWithActivity = weeks.map((week) => {
    return week.map((day) => {
      let date = day.toLocaleDateString();
      if (date in dateAndActivity) {
        return { date: day, activity: dateAndActivity[date] };
      } else {
        return { date: day, activity: [] };
      }
    });
  });
  let maxIntensity = 1;
  weekWithActivity.forEach((week) => {
    week.forEach((day) => {
      maxIntensity = Math.max(
        maxIntensity,
        gamesPlayedByActivityArray(day.activity)
      );
    });
  });
  let monthAndWeekCount = {
    0: { name: "Jan", weekCount: 0 },
    1: { name: "Feb", weekCount: 0 },
    2: { name: "Mar", weekCount: 0 },
    3: { name: "Apr", weekCount: 0 },
    4: { name: "May", weekCount: 0 },
    5: { name: "Jun", weekCount: 0 },
    6: { name: "Jul", weekCount: 0 },
    7: { name: "Aug", weekCount: 0 },
    8: { name: "Sep", weekCount: 0 },
    9: { name: "Oct", weekCount: 0 },
    10: { name: "Nov", weekCount: 0 },
    11: { name: "Dec", weekCount: 0 },
  };
  for (let i = 0; i < currentMonth; i++) {
    for (let j = 0; j <= 11; j++) {
      monthAndWeekCount[j - 1] = monthAndWeekCount[j];
    }
    monthAndWeekCount[11] = monthAndWeekCount[-1];
    delete monthAndWeekCount[-1];
  }
  weekWithActivity.forEach((week) => {
    monthAndWeekCount[
      week.find((d) => d != null).date.getMonth()
    ].weekCount += 1;
  });
  let monthNumbers = Array.from(Array(12).keys());
  let totalGamesPlayed = fullHistory
    .filter((activity) => {
      return (
        new Date(activity.diff.timestamp) > start &&
        new Date(activity.diff.timestamp) < end
      );
    })
    .reduce((sum, activity) => sum + activity.diff.won + activity.diff.lost, 0);
  const years = [];
  fullHistory.forEach((item) => {
    const yearButtonValue = new Date(item.diff.timestamp)
      .getFullYear()
      .toString();
    if (!years.includes(yearButtonValue)) {
      return years.push(yearButtonValue);
    }
  });
  years.forEach((item) => {
    let GamesAtSelectedYear = fullHistory
      .filter(
        (activity) =>
          item === new Date(activity.diff.timestamp).getFullYear().toString()
      )
      .reduce(
        (sum, activity) => sum + activity.diff.won + activity.diff.lost,
        0
      );
    return GamesAtSelectedYear > 0;
  });
  years.sort((a, b) => b - a);

  // Calculate season spans for the displayed weeks
  const seasonSpans = useMemo(() => {
    const spans: Array<{
      seasonId: number;
      shortName: string;
      startWeek: number;
      endWeek: number;
      color: string;
      dayCount: number;
      startDate: string;
      endDate: string;
      isOffSeason: boolean;
    }> = [];

    // Color palette for seasons (cycling)
    const seasonColors = [
      "bg-emerald-500/30 border-emerald-500/50",
      "bg-sky-500/30 border-sky-500/50",
      "bg-purple-500/30 border-purple-500/50",
      "bg-amber-500/30 border-amber-500/50",
      "bg-rose-500/30 border-rose-500/50",
      "bg-cyan-500/30 border-cyan-500/50",
    ];
    const offSeasonColor = "bg-slate-700/30 border-slate-600/40";

    if (weekWithActivity.length === 0) return spans;

    let currentSeasonId: number | null = null;
    let currentSpanStart = 0;
    let spanStartDate: Date | null = null;
    let spanEndDate: Date | null = null;

    const addSpan = (
      seasonId: number,
      startWeek: number,
      endWeek: number,
      startDateVal: Date | null,
      endDateVal: Date | null
    ) => {
      if (!startDateVal) return;
      const isOffSeason = seasonId === -1;
      const existingSeason = isOffSeason
        ? null
        : WOW_SEASONS.find((s) => s.id === seasonId);
      const dayCount =
        endDateVal && startDateVal
          ? Math.ceil(
            (endDateVal.getTime() - startDateVal.getTime()) /
            (1000 * 60 * 60 * 24)
          ) + 1
          : 0;
      // Skip off-season periods that are 2 days or less
      if (isOffSeason && dayCount <= 2) return;
      spans.push({
        seasonId,
        shortName: isOffSeason ? "Off Season" : existingSeason?.shortName || "",
        startWeek,
        endWeek,
        color: isOffSeason
          ? offSeasonColor
          : seasonColors[seasonId % seasonColors.length],
        dayCount,
        startDate: startDateVal.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        endDate:
          endDateVal?.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }) || "",
        isOffSeason,
      });
    };

    // Iterate through all weeks
    for (let weekIndex = 0; weekIndex < weekWithActivity.length; weekIndex++) {
      const week = weekWithActivity[weekIndex];
      // Get the first valid day of the week
      const firstDay = week.find((d) => d != null);
      if (!firstDay) continue;

      const season = getSeasonForTimestamp(firstDay.date.getTime());
      const seasonId = season?.id ?? -1;

      if (seasonId !== currentSeasonId) {
        // Close previous span
        if (currentSeasonId !== null && spanStartDate) {
          addSpan(
            currentSeasonId,
            currentSpanStart,
            weekIndex - 1,
            spanStartDate,
            spanEndDate
          );
        }
        // Start new span
        currentSeasonId = seasonId;
        currentSpanStart = weekIndex;
        spanStartDate = firstDay.date;
        spanEndDate = firstDay.date;
      } else {
        // Update end date
        const lastDay = [...week].reverse().find((d) => d != null);
        if (lastDay) {
          spanEndDate = lastDay.date;
        }
      }
    }

    // Close the last span - ensure it reaches the end
    // But skip off-season if it extends beyond today (future/ongoing)
    if (currentSeasonId !== null && spanStartDate) {
      // Get the last day from the last week
      const lastWeek = weekWithActivity[weekWithActivity.length - 1];
      const lastDay = [...lastWeek].reverse().find((d) => d != null);
      if (lastDay) {
        spanEndDate = lastDay.date;
      }
      const isOffSeasonAtEnd = currentSeasonId === -1;
      const today = new Date();
      // Skip trailing off-season if it starts after today or extends beyond today
      const offSeasonIncludesFuture =
        spanStartDate.getTime() >= today.getTime() ||
        (spanEndDate && spanEndDate.getTime() >= today.getTime());
      if (!(isOffSeasonAtEnd && offSeasonIncludesFuture)) {
        addSpan(
          currentSeasonId,
          currentSpanStart,
          weekWithActivity.length - 1,
          spanStartDate,
          spanEndDate
        );
      }
    }

    return spans;
  }, [weekWithActivity]);

  return (
    <div className="flex flex-col lg:flex-row justify-between p-3 md:p-4 border border-solid border-slate-600/40 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/70 shadow-lg">
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <SportsEsportsIcon className="!w-6 !h-6 text-[#60A5FACC]" />
          <span className="text-xl font-semibold text-white">
            <span className="text-[#60A5FACC]">
              {totalGamesPlayed.toLocaleString()}
            </span>{" "}
            games played{" "}
            {selectedYear === currentDate
              ? "in the last year"
              : `in ${selectedYear}`}
          </span>
        </div>
        <TableContainer
          component={Paper}
          sx={{ backgroundColor: "transparent", boxShadow: "none" }}
        >
          <Table
            sx={{
              backgroundColor: "transparent",
            }}
            aria-label="simple table"
          >
            <TableHead>
              <TableRow>
                <StyledTableCell component="th" scope="row" size="small" align="left" />
                {Object.keys(monthNumbers).map((month) => {
                  return (
                    <StyledTableCell
                      component="th"
                      scope="row"
                      size="small"
                      padding="none"
                      align="left"
                      colSpan={monthAndWeekCount[month].weekCount}
                      key={month}
                    >
                      <span className="text-[#9CA3AF] text-xs">
                        {monthAndWeekCount[month].name}
                      </span>
                    </StyledTableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(Array(7).keys()).map((row) => {
                return (
                  <TableRow key={row} sx={{}}>
                    {getDayOfWeekRender(row)}
                    {Array.from(Array(weekWithActivity.length).keys()).map(
                      (col) => {
                        if (
                          weekWithActivity[col] !== undefined &&
                          weekWithActivity[col][row] !== undefined
                        ) {
                          const dna = weekWithActivity[col][row];
                          return (
                            <StyledTableCell
                              key={`${col}-${row}`}
                              component="th"
                              scope="row"
                              size="small"
                              padding="none"
                            >
                              <ActivityBox
                                maxIntensity={maxIntensity}
                                activity={dna.activity}
                                date={dna.date}
                                year={dna.date.getFullYear().toString()}
                                selectedYear={selectedYear}
                                currentDate={currentDate}
                              />
                            </StyledTableCell>
                          );
                        } else {
                          return (
                            <StyledTableCell
                              key={`${col}-${row}-empty`}
                              component="th"
                              scope="row"
                              size="small"
                              padding="none"
                            >
                              <ActivityBox
                                maxIntensity={0}
                                activity={[]}
                                date={undefined}
                                year={0}
                                selectedYear={selectedYear}
                                currentDate={currentDate}
                              />
                            </StyledTableCell>
                          );
                        }
                      }
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Season indicator row - below the diagram */}
        <div className="flex mt-2 ml-6">
          {seasonSpans.map((span, idx) => {
            const widthPercent =
              ((span.endWeek - span.startWeek + 1) / weekWithActivity.length) *
              100;
            return (
              <Tooltip
                key={`${span.seasonId}-${idx}`}
                title={`${span.startDate} - ${span.endDate}`}
                placement="bottom"
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
                <div
                  className={`text-[10px] font-medium px-2 py-1 mx-0.5 rounded border ${span.color
                    } flex items-center justify-center gap-1 cursor-default ${span.isOffSeason
                      ? "border-dashed text-slate-500 italic"
                      : "text-slate-200"
                    }`}
                  style={{ width: `${widthPercent}%`, minWidth: "fit-content" }}
                >
                  <span
                    className={
                      span.isOffSeason ? "text-slate-500" : "font-semibold"
                    }
                  >
                    {span.shortName}
                  </span>
                  <span
                    className={`text-[9px] ${span.isOffSeason ? "text-slate-600" : "text-slate-400"
                      }`}
                  >
                    {span.dayCount}d
                  </span>
                </div>
              </Tooltip>
            );
          })}
        </div>
        <RadarChart
          player={player}
          fullHistory={fullHistory}
          selectedYear={selectedYear}
          start={start}
          end={end}
          currentDate={currentDate}
        ></RadarChart>
      </div>

      {/* Year Selector */}
      <div className="flex lg:flex-col gap-2 lg:ml-3 mt-3 lg:mt-0 lg:shrink-0">
        {years.map((item) => (
          <button
            key={item}
            className={`px-4 py-2 text-sm font-medium rounded-lg select-none transition-all duration-200 ${String(item) === String(selectedYear) ||
                (selectedYear === currentDate && String(item) === years[0])
                ? "bg-gradient-to-r from-[#3f6ba3] to-[#60A5FA] text-white shadow-lg shadow-[#60A5FA30]"
                : "bg-slate-900/60 text-slate-400 hover:bg-slate-800/80 hover:text-white border border-slate-600/40"
              }`}
            onClick={() => setSelectedYear(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActivityDiagram;
