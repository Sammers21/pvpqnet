import { IPlayer, IPlayerBracket } from "@/types";
import { useState } from "react";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { gridClasses } from "@mui/x-data-grid";
import { styled } from "@mui/material";
import moment from "moment-timezone";
import { getDiffCell, getDiffColor, getWonAndLossColors } from "@/utils/table";

const GamingHistoryDataGripd = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.green`]: {
    backgroundColor: "#172517",
    opacity: 0.8,
  },
  [`& .${gridClasses.row}.red`]: {
    backgroundColor: "#2b1715",
    opacity: 0.8,
  },
  [`& .${gridClasses.row}.black`]: {
    backgroundColor: "#0c0c0c",
    opacity: 0.8,
  },
}));

const GamingHistory = ({ player }: { player: IPlayer }) => {
  var tz = player.region === "eu" ? "Europe/Paris" : "America/Chicago";
  const timeStampToString = (ts: number) => {
    var momnt = moment
      .unix(ts / 1000)
      .utc()
      .tz(tz);
    return momnt.format("MMM DD, YYYY - hh:mm A");
  };
  var initialBracket = player.brackets.filter(
    (gamingHist) => gamingHist.bracket_type === "ARENA_3v3"
  )[0];
  if (initialBracket === undefined) {
    initialBracket = player.brackets[0];
  }
  const [bracket, setBracket] = useState<IPlayerBracket>(initialBracket);
  const gamingHistoryColumns: GridColDef[] = [
    {
      field: "RANK",
      headerName: "RANK",
      width: 90,
      sortable: false,
    },
    {
      field: "WL",
      headerName: "WON/LOST",
      width: 90,
      valueGetter: (params: GridValueGetterParams) => {
        return params.row.WL.won + "/" + params.row.WL.lost;
      },
      renderCell: (params: GridValueGetterParams) => {
        const won = params.row.WL.won;
        const loss = params.row.WL.lost;
        const { wonColor, lossColor } = getWonAndLossColors(won, loss);
        return (
          <div className="flex">
            <span
              className="text-base font-light mr-1"
              style={{ color: wonColor }}
            >{`${won} `}</span>
            <span className="text-base font-light">{` / `}</span>
            <span
              className="text-base font-light ml-1"
              style={{ color: lossColor }}
            >
              {loss}
            </span>
          </div>
        );
      },
      sortable: false,
    },
    {
      field: "RATING",
      headerName: "Rating",
      width: 90,
      renderCell: (params: GridValueGetterParams) => {
     const rating = record?.character?.rating ?? record?.rating;
      const ratingColor = getRatingColor(record?.character?.in_cutoff ?? record?.in_cutoff);
      const ratingDiff = record?.diff?.rating_diff;

      return (
        <div className="flex">
          <span className="text-base font-light mr-2" style={{ color: ratingColor }}>
            {rating}
          </span>
          {Number.isInteger(ratingDiff) && (
            <span className="text-base font-light" style={{ color: getDiffColor(ratingDiff) }}>
              {getDiffCell(ratingDiff)}
            </span>
          )}
        </div>
      );
      },
    },
    {
      field: "WWHO",
      headerName: "WWHO",
      width: 300,
      valueGetter: (params: GridValueGetterParams) => {
        return params.row.WWHO.join(", ");
      },
      sortable: false,
    },
    {
      field: "id",
      headerName: "SERVER TIME " + player.region.toUpperCase(),
      width: 200,
      valueGetter: (params: GridValueGetterParams) => {
        return timeStampToString(params.row.id);
      },
    },
  ];
  const gamingHistoryRows = bracket.gaming_history.history.map((gamingHist) => {
    return {
      RANK: gamingHist.diff.rank_diff,
      WL: gamingHist.diff,
      RATING: gamingHist.diff.rating_diff,
      id: gamingHist.diff.timestamp,
      WWHO: gamingHist.with_who,
    };
  });
  return (
    <div className="flex flex-col md:px-3 py-4 border border-solid border-[#37415180] rounded-lg bg-[#030303e6]">
      <div className="flex justify-between items-center px-3 md:px-0">
        <span className="text-2xl">Gaming History</span>
      </div>
      <hr className="h-px md:my-2 bg-[#37415180] border-0" />
      <div className="gaming-history-bg">
        <GamingHistoryDataGripd
          rows={gamingHistoryRows}
          columns={gamingHistoryColumns}
          disableColumnMenu={true}
          hideFooter={true}
          sx={{ "&, [class^=MuiDataGrid]": { border: "none" } }}
          disableRowSelectionOnClick
          initialState={{
            sorting: { sortModel: [{ field: "id", sort: "desc" }] },
          }}
          getRowClassName={(params) => {
            var res = "";
            if (params.row.RATING === 0) {
              res = "black";
            }
            res = params.row.RATING > 0 ? "green" : "red";
            // res += " " + gridClasses.
            return res;
          }}
        />
      </div>
    </div>
  );
};

export default GamingHistory;
