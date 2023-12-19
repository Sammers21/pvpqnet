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
}

const StyledTableCell = styled(TableCell)({
  padding: 0,
  border: 0,
})

const ActivityDiagram = ({ player }: IProps) => {
  if (true) {
    return <> </>;
  } else {
    let rows = 7;
    let cols = 52;
    return (
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <StyledTableCell>1</StyledTableCell>
              {Array.from(Array(cols).keys()).map((col) => (
                <StyledTableCell align="right">{1}</StyledTableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(Array(rows).keys()).map((row) => (
              <TableRow key={row} sx={{}}>
                <StyledTableCell component="th" scope="row">
                  1
                </StyledTableCell>
                {Array.from(Array(cols).keys()).map((col) => {
                  const rnd_intensity = Math.floor(Math.random() * 5);
                  return (
                    <StyledTableCell align="right">
                      {/* <div style={{width: '10px', height: '10px', backgroundColor: 'red'}}></div> */}

                      <ActivityBox />
                    </StyledTableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }
};

export default ActivityDiagram;
