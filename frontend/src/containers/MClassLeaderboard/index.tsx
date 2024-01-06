import * as React from "react";
import clone from "clone";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { DataGrid, GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import { BRACKETS } from "@/constants/pvp-activity";
import { REGIONS } from "@/constants/region";
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
  const { region = REGIONS.eu } = useParams();
  const [data, setData] = React.useState({ multiclassers: [] });
  const getLeadeboard = async (region: REGIONS) => {
    const dt = await getMulticlasserLeaderboard(region);
    console.log(dt);
    setData(dt);
  };
  React.useEffect(() => {
    getLeadeboard(region as REGIONS);
  }, [region]);
  const [shuffleRole, setValue] = React.useState("all");
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  const [rowsToShow, setRowsToShow] = React.useState([]);
  React.useEffect(() => {
    console.log("Calculating rows to show: " + shuffleRole);
    let allowedSpecs;
    if (shuffleRole === "all") {
      allowedSpecs = ALL_SPECS;
    } else if (shuffleRole === "dps") {
      allowedSpecs = DPS_SPECS;
    } else if (shuffleRole === "healer") {
      allowedSpecs = HEAL_SPECS;
    } else if (shuffleRole === "melee") {
      allowedSpecs = MELEE_SPECS;
    } else if (shuffleRole === "ranged") {
      allowedSpecs = RANGED_SPECS;
    } else if (shuffleRole === "tank") {
      allowedSpecs = TANK_SPECS;
    } else {
      allowedSpecs = ALL_SPECS;
    }
    let res = clone(data.multiclassers)
      .filter((multiclasser) => {
        const keys = Object.keys(multiclasser.specs);
        for (let i = 0; i < keys.length; i++) {
          const spec = keys[i];
          if (allowedSpecs.includes(spec)) {
            return true;
          }
        }
        return false;
      })
      .map((multiclasser) => {
        const keys = Object.keys(multiclasser.specs);
        const specs = {};
        for (let i = 0; i < keys.length; i++) {
          const spec = keys[i];
          if (allowedSpecs.includes(spec)) {
            specs[spec] = multiclasser.specs[spec];
          }
        }
        multiclasser.specs = specs;
        return multiclasser;
      })
      .map((multiclasser) => {
        // recalcuate total score
        let total_score = 0;
        const keys = Object.keys(multiclasser.specs);
        for (let i = 0; i < keys.length; i++) {
          const spec = keys[i];
          total_score += multiclasser.specs[spec].score;
        }
        multiclasser.total_score = total_score;
        return multiclasser;
      })
      .sort((a, b) => {
        return b.total_score - a.total_score;
      });
    // iter dt multiclassers
    for (let i = 0; i < res.length; i++) {
      const multiclasser = res[i];
      // iter multiclasser specs
      multiclasser.rank = i + 1;
    }
    setRowsToShow(res);
  }, [shuffleRole, data]);
  return (
    <div className="flex w-full justify-center bg-[#030303e6] pt-24 pb-11">
      <div className="w-full md:w-4/5">
        <Box sx={{ width: "100%" }}>
          <Tabs
            value={shuffleRole}
            onChange={handleChange}
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
