import { IPlayer } from "@/types";
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

interface IProps {
  player: IPlayer;
  year?: number;
}

const StyledTableCell = styled(TableCell)({
  padding: 0,
  border: 0,
  width: "10px",
  height: "10px",
});

const currentYear = new Date().getFullYear();

function activityHistoryForPlayer(player: IPlayer) {
  let totalPlayers = [player, ...player.alts];
  return totalPlayers
    .map((p) =>
      p.brackets.map((bracket) => bracket.gaming_history.history).flat()
    )
    .flat();
}
function getDayOfWeekRender(numberOfDay) {
  let days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (numberOfDay == 1 || numberOfDay == 3 || numberOfDay == 5) {
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

const ActivityDiagram = ({ player, year = currentYear }: IProps) => {
  if (false) {
    return <> </>;
  } else {
    let weeks = [];
    var currentWeek = [];
    let fullHistory = activityHistoryForPlayer(player);
    // group fullHistory by date
    let dateAndActivity = {};
    var start = new Date(`01/01/${year}`);
    var end = new Date();
    var loop = new Date(start);
    while (loop <= end) {
      let dt = loop.toLocaleDateString();
      let dayOfWeek = loop.getDay();
      currentWeek.push(loop);
      if (dayOfWeek == 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      dateAndActivity[dt] = [];
      var newDate = loop.setDate(loop.getDate() + 1);
      loop = new Date(newDate);
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
          return [];
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
    weekWithActivity.forEach((week) => {
      monthAndWeekCount[week[0].date.getMonth()].weekCount += 1;
    });
    let totalGamesPlayed = fullHistory.map((activity) => { return activity.diff.won + activity.diff.lost }).reduce((a, b) => a + b, 0)
    //     <div className="flex flex-col py-2 md:px-3 border border-solid border-[#37415180] rounded-lg bg-[#030303e6] ">
    //   <div className="flex justify-between items-center px-3 md:px-0">
    //     <span className="text-2xl mr-4">History</span>
    //     <BracketTabs
    //       player={player}
    //       onChange={handleChange}
    //       active_bracket_name={active_bracket_name}
    //       isMobile={isMobile}
    //     />
    //   </div>
    //   <hr className="h-px md:mb-2 bg-[#37415180] border-0" />
    //   <Table
    //     columns={tableColumns(
    //       player,
    //       active_bracket_name,
    //       breakpoints === "sm"
    //     )}
    //     records={records}
    //     isMobile={breakpoints === "sm"}
    //   />
    // </div>
    return (
      <div className="flex flex-col py-2 md:px-3 border border-solid border-[#37415180] rounded-lg bg-[#030303e6] ">
        <span className="text-2xl mr-4">{totalGamesPlayed} games played in {year}</span>
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
                {Object.keys(monthAndWeekCount).map((month) => {
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
                    {Array.from(Array(52).keys()).map((col) => {
                      if (
                        weekWithActivity[col] !== undefined &&
                        weekWithActivity[col][row] !== undefined
                      ) {
                        const dna = weekWithActivity[col][row];
                        return (
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
                            />
                          </StyledTableCell>
                        );
                      } else {
                        return (
                          <StyledTableCell
                            component="th"
                            scope="row"
                            size="small"
                            padding="none"
                          >
                            <ActivityBox activity={[]} date={undefined} />
                          </StyledTableCell>
                        );
                      }
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    );
  }
};

export default ActivityDiagram;
