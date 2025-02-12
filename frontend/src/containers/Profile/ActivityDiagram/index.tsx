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
        <div className="pl-1"> {days[numberOfDay]}</div>
      </StyledTableCell>
    );
  } else {
    return <div></div>;
  }
}

export function gamesPlayedByActivityArray(activityArray) {
  return activityArray
    .map((entry) => entry.diff.won + entry.diff.lost)
    .reduce((a, b) => a + b, 0);
}

const currentDate = new Date().toString()
const ActivityDiagram = ({player}: IProps) => {
  const [selectedYear,setSelectedYear ] = useState(currentDate);
  useEffect(() => {
    setSelectedYear(currentDate)
  },[player])
    let fullHistory = activityHistoryForPlayer(player);
    let weeks = [];
    var currentWeek = [];
    let dateAndActivity = {};
    let start;
    let end;
    let currentMonth;
    if (selectedYear !== currentDate){
      start = new Date(Number(selectedYear),0,0,0,0,0);
      end = new Date(new Date(Number(selectedYear),11,30).toString());
    }
    else{
      start = new Date(new Date().setFullYear(new Date().getFullYear() - 1));
      end = new Date()
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
    let monthNumbers = Array.from(Array(12).keys())
    let totalGamesPlayed = fullHistory
      .filter((activity) => {
        return (new Date(activity.diff.timestamp) > start && new Date(activity.diff.timestamp) < end);
      })
      .reduce((sum, activity) => sum + activity.diff.won + activity.diff.lost, 0);
    const years = [];
    fullHistory.forEach((item) => {
      const yearButtonValue = new Date(item.diff.timestamp).getFullYear().toString();
      if (!years.includes(yearButtonValue)) {
        return years.push(yearButtonValue);
      }
    });
    years.forEach((item) => {
      let GamesAtSelectedYear = fullHistory.filter(activity => item === new Date(activity.diff.timestamp).getFullYear().toString())
      .reduce((sum,activity) => sum + activity.diff.won + activity.diff.lost,0);
      return GamesAtSelectedYear>0;
    })
    years.sort((a,b) => b-a);
    return (
      <>
      <div className="lg:flex">
          <div className="lg:flex justify-between py-2 md:px-3 border border-solid border-[#37415180] lg:w-[86.7%] rounded-lg bg-[#030303e6]">
            <div className="flex flex-col w-[100%]">
            <span className="text-2xl mr-4">
              {totalGamesPlayed} games played in {selectedYear === currentDate ? 'the last year' : selectedYear}
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
                                      year={dna.date.getFullYear().toString()}
                                      selectedYear={selectedYear}
                                      currentDate={currentDate}
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
                                      currentDate={currentDate}
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
        </div>
          <div className="flex lg:flex-col gap-1 lg:ml-[10px] mg:mt-[10px]">
            {years.map((item) => (
              <button
              className={`pl-[12px] block w-[100px] p-[8px] text-[13px] text-left font-sans rounded-[6px] select-none ${
                String(item) === String(selectedYear) || (selectedYear === currentDate && String(item) === years[0])
                ? "bg-[#3f6ba3] text-white" 
                : "hover:bg-gray-800"
              }`}
              onClick={() => setSelectedYear(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </>
    );
};

export default ActivityDiagram;
