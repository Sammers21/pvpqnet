import * as React from "react";
import clone from "clone";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { BRACKETS } from "@/constants/pvp-activity";
import { REGION } from "@/constants/region";
import {
  fetchStatistic,
  getLadder,
  getMulticlasserLeaderboard,
  statsMap,
} from "@/services/stats.service";
import { capitalizeFirstLetter } from "@/utils/common";
import { useParams } from "react-router-dom";
import {
  getAltProfileUrl,
  getClassNameColor,
  getRatingColor,
  getSpecIcon,
  ratingToColor,
} from "@/utils/table";
import { Avatar, Chip } from "@mui/material";
import CharacterChip from "../Profile/History/CharacterChip";
import {
  ALL_SPECS,
  DPS_SPECS,
  HEAL_SPECS,
  MELEE_SPECS,
  RANGED_SPECS,
  TANK_SPECS,
} from "@/constants/filterSchema";
import { StripedDataGrid } from "../Meta/Grid";

function columns(region): GridColDef[] {
  return [
    {
      field: "rank",
      headerName: "Rank",
      width: 90,
      valueFormatter: (params: GridValueGetterParams) => {
        return `#${params.value}`;
      },
    },
    { field: "total_score", headerName: "Score", width: 90 },
    {
      field: "main",
      headerName: "Main",
      width: 200,
      valueFormatter: (params: GridValueGetterParams) => {
        return capitalizeFirstLetter(
          params.value.name + "-" + params.value.realm
        );
      },
      renderCell: (params: GridValueGetterParams) => {
        params.value.region = region;
        const url = getAltProfileUrl(params.value);
        return (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={url}
            className="text-base no-underline"
            style={{ color: getClassNameColor(params.value.class) }}
          >
            {params.value.name + "-" + params.value.realm}
          </a>
        );
      },
    },
    {
      field: "specs",
      headerName: "Specs",
      flex: 1,
      valueFormatter: (params: GridValueGetterParams) => {
        // get all keys of params.value
        return Object.keys(params.value)
          .map((key) => {
            return key + ": " + params.value[key].score;
          })
          .join(", ");
      },
      renderCell: (params: GridValueGetterParams) => {
        const keys = Object.keys(params.value);
        // sort keys by score
        keys.sort((a, b) => {
          return params.value[b].score - params.value[a].score;
        });
        return (
          <div className="flex flex-row ">
            {keys.map((key) => {
              const specIcon = getSpecIcon(key);
              const ratingColor = ratingToColor(
                params.value[key].character.rating,
                params.value[key].character.in_cutoff
              );
              const chip = (
                <Chip
                  avatar={<Avatar alt="class" src={specIcon} />}
                  label={`#${params.value[key].character.pos}`}
                  variant="outlined"
                  style={{ color: ratingColor, borderColor: ratingColor }}
                  size="small"
                />
              );
              return <div>{chip}</div>;
            })}
          </div>
        );
      },
    },
  ];
}

function MClassLeaderboard(dota) {
  const { region = REGION.eu } = useParams();
  const [shuffleRole, setValue] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [rowsToShow, setRowsToShow] = React.useState([]);
  const getLeadeboard = async (region: REGION, role, page) => {
    const dt = await getMulticlasserLeaderboard(region, role, page);
    const res = dt.multiclassers;
    for (let i = 0; i < res.length; i++) {
      const multiclasser = res[i];
      multiclasser.rank = i + 1;
    }
    setRowsToShow(res);
  };
  React.useEffect(() => {
    getLeadeboard(region as REGION, shuffleRole, page);
  }, [region, shuffleRole, page]);
  console.log("rowsToShow", rowsToShow);
  return (
    <div className="flex w-full justify-center bg-[#030303e6] pt-24 pb-11">
      <div className="w-full md:w-4/5">
        <Box sx={{ width: "100%" }}>
          <Tabs
            value={shuffleRole}
            onChange={(event: React.SyntheticEvent, newValue: string) => {
              setValue(newValue);
            }}
            variant="scrollable"
            scrollButtons
            allowScrollButtonsMobile
            aria-label="scrollable force tabs example"
          >
            <Tab label="All" value="all" />
            <Tab label="DPS" value="dps" />
            <Tab label="Healer" value="healer" />
            <Tab label="Melee" value="melee" />
            <Tab label="Ranged" value="ranged" />
            <Tab label="Tank" value="tank" />
          </Tabs>
          <StripedDataGrid
            rows={rowsToShow}
            getRowId={(row) => row.rank}
            columns={columns(region)}
            disableColumnMenu={true}
            hideFooter={true}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 100,
                },
              },
              sorting: { sortModel: [{ field: "total_score", sort: "desc" }] },
            }}
            pageSizeOptions={[100]}
            rowHeight={33.5}
            disableRowSelectionOnClick
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
            }
          />
        </Box>
      </div>
    </div>
  );
}

export default MClassLeaderboard;
