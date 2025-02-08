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
} from "@mui/material";
import { ActivityBox } from "./ActivityBox";
import react from "react";
import { useState, useEffect } from "react";
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

const currentYear = new Date().getFullYear();

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
  if (numberOfDay % 2 == 0) {
    return (
      <StyledTableCell component="th" scope="row" size="small" align="left">
        {" "}
        <div className="pl-1"> {days[numberOfDay]}</div>
      </StyledTableCell>
    );
  } else {
    return <div></div>;
  }
}

function ChangeYear(year: string, setSelectedYear) {
  return setSelectedYear(year);
}
export function gamesPlayedByActivityArray(activityArray) {
  return activityArray
    .map((entry) => entry.diff.won + entry.diff.lost)
    .reduce((a, b) => a + b, 0);
}

const ActivityDiagram = ({ player, year = currentYear }: IProps) => {
  const [selectedYear , setSelectedYear ] = useState(currentYear.toString());
  if (false) {
    return <></>;
  } else {
    let fullHistory = activityHistoryForPlayer(player);
    let weeks = [];
    var currentWeek = [];
    let dateAndActivity = {};
    let start = new Date(selectedYear);
    let end = new Date((Number(selectedYear)+1).toString());
    let currentMonth = new Date((Number(start)).toString()).getMonth();
    var loop = new Date(start);
    while (loop <= end) {
      let dt = loop.toLocaleDateString();
      let dayOfWeek = loop.getDay();
      currentWeek[dayOfWeek] = loop;
      // currentWeek.push(loop);
      if (dayOfWeek == 6) {
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
    console.log(start)
    console.log(end)
    let totalGamesPlayed = fullHistory
      .filter((activity) => {
        let displayedYear = new Date(activity.diff.timestamp)
          .toString()
          .split(" ")[3];
        if (displayedYear === selectedYear) {
          return (new Date(activity.diff.timestamp) > start && new Date(activity.diff.timestamp) < end);
        }
      })
      .map((activity) => {
        return activity.diff.won + activity.diff.lost;
      })
      .reduce((a, b) => a + b, 0);
    const years = [];
    fullHistory.map((item) => {
      let yearButtonValue = new Date(item.diff.timestamp).toString().split(" ")[3];
      if (!years.includes(yearButtonValue)) {
        years.push(yearButtonValue);
      }
    });
    years.forEach((item) => {
      let GamesAtSelectedYear = fullHistory.filter(activity => item === new Date(activity.diff.timestamp).toString().split(" ")[3])
      .map((activity) => activity.diff.won + activity.diff.lost)
      .reduce((a,b) => a+b,0)
      return GamesAtSelectedYear>0;
    })
    years.sort((a,b) => b-a);
    
    if (!years.includes(selectedYear)){
      setSelectedYear(years[0])
    }
    return (
      <>
        <div className="lg:grid grid-cols-[30fr_10px]">
          <div className="flex flex-col py-2 md:px-3 border border-solid border-[#37415180] rounded-lg bg-[#030303e6]">
            <span className="text-2xl mr-4">
              {totalGamesPlayed} games played in the {selectedYear}
            </span>
            <TableContainer component={Paper}>
              <Table
                sx={{
                  backgroundColor: "#030303e6",
                }}
                aria-label="simple table"
              >
                <TableHead>
                  <TableRow>
                    <div></div>
                    {Object.keys(monthNumbers).map((month) => {
                      return (
                        <StyledTableCell
                          component="th"
                          scope="row"
                          size="small"
                          padding="none"
                          align="left"
                          colSpan={monthAndWeekCount[month].weekCount}
                        >
                          {monthAndWeekCount[month].name}
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
                                <>
                                  <StyledTableCell
                                    component="th"
                                    scope="row"
                                    size="small"
                                    padding="none"
                                  >
                                    <ActivityBox
                                      maxIntensity={maxIntensity}
                                      activity={dna.activity}
                                      date={dna.date}
                                      year={dna.date.toString().split(" ")[3]}
                                      selectedYear={selectedYear}
                                    />
                                  </StyledTableCell>
                                </>
                              );
                            } else {
                              return (
                                <>
                                  <StyledTableCell
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
                                    />
                                  </StyledTableCell>
                                </>
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
          </div>
          <div className="flex lg:flex-col gap-2 lg:ml-[15px] mg:mt-[10px]">
            {years.map((item) => (
              <button
                className={` pl-[12px] block w-[100px] p-[8px] text-[13px] text-left font-sans rounded-[6px] ${
                  String(item) == String(selectedYear)
                    ? "bg-[#3f6ba3] text-white"
                    : ""
                }`}
                onClick={() => ChangeYear(item, setSelectedYear)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }
};

export default ActivityDiagram;
