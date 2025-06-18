import { REGION } from "@/constants/region";
import { getMulticlasserLeaderboard } from "@/services/stats.service";
import { capitalizeFirstLetter } from "@/utils/common";
import {
  getAltProfileUrl,
  getClassNameColor,
  getSpecIcon,
  ratingToColor,
} from "@/utils/table";
import { Avatar, Chip, Pagination, Popover, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { GridColDef, GridValueGetterParams } from "@mui/x-data-grid";
import * as React from "react";
import { useParams } from "react-router-dom";
import { StripedDataGrid } from "../Meta/Grid";
import InfoIcon from "@mui/icons-material/Info";
import Row from "@/components/AltsTable/Row";

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
    {
      field: "total_score",
      headerName: "Score",
      width: 90,
      renderCell: (params: GridValueGetterParams) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [anchorEl, setAnchorEl] =  React.useState<HTMLButtonElement | null>(null);

        const handleClick = (event) => {
          setAnchorEl(event.currentTarget);
        };

        const handleClose = () => {
          setAnchorEl(null);
        };

        const open = Boolean(anchorEl);
        const id = open ? "simple-popover" : undefined;
        const renderPopoverContent = () => {
          const keys = Object.keys(params.row.specs);
          // sort keys by score
          keys.sort((a, b) => {
            return params.row.specs[b].score - params.row.specs[a].score
          });
          
          return (
            <div>
              <Typography className="flex p-[7px] rounded-[5px] bg-gray-900 border border-solid border-[#3f6ba3] gap-[5px]">
                {keys.map((item,index) => (
                <>
                <div className="flex flex-col justify-center text-center">
                  <img className="w-[30px] h-[30px]" src={getSpecIcon(item)} alt="" />
                  <span>{params.row.specs[item].score}</span>
                </div>
                <span className="text-[25px]">{index === keys.length-1 ? '' : '+'}</span>
                </>
              ))}</Typography>
            </div>
          );
        };

        return (
          <div className="flex flex-row gap-1">
            <Typography variant="body1">{params.value}</Typography>
            <div onClick={handleClick}>
              <InfoIcon fontSize="small" color="primary" />
            </div>
            <Popover
              id={id}
              open={open}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
            >
              {renderPopoverContent()}
            </Popover>
          </div>
        );
      },
    },
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
          <div className="flex flex-row gap-1">
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

function MClassLeaderboard() {
  const { region = REGION.eu } = useParams();
  const [role, setRole] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [rowsToShow, setRowsToShow] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const getLeaderboard = async (region: REGION, role, page) => {
    setLoading(true);
    const dt = await getMulticlasserLeaderboard(region, role, page);
    const res = dt.multiclassers;
    if (res !== undefined) {
      setRowsToShow(res);
      setTotalPages(dt.total_pages);
      setLoading(false);
    }
  };
  React.useEffect(() => {
    getLeaderboard(region as REGION, role, page);
  }, [region, role, page]);
  let pagination = (
    <Pagination
      boundaryCount={2}
      count={totalPages}
      onChange={(e, p) => setPage(p)}
    />
  );
  const height = rowsToShow.length == 0 ? "500px" : "auto";
  return (
    <div className="flex w-full justify-center bg-[#030303e6] pt-24 pb-11">
      <div className="w-full h-full md:w-10/12">
        <div className="mx-2 my-2 mb-10 px-4 py-4 rounded-2xl bg-[#2f384d4d]">
          <Typography variant="h4">Multiclassers</Typography>
          <Typography variant="body1">
            Top multiclassers in {region.toUpperCase()} based on their highest
            ladder spots on every unique spec.
          </Typography>
          <Typography variant="body1">
             Each spec is counted only once,
            and the maximum score per each spec is 1000 for rank #1.
          </Typography>
          <br />
          <Typography variant="h5" sx={{ }}>      
             The spec score is calculated as follows:
          </Typography>
          <Typography variant="body2">
            1. above 0.1% is 900-1000 score
          </Typography>
          <Typography variant="body2">
            2. from 0.1% to 0.2% is 750-900 score
          </Typography>
          <Typography variant="body2">
            3. from 0.2% to 0.5% is 550-750 score
          </Typography>
          <Typography variant="body2">
            4. from 0.5% to 1% is 300-550 score
          </Typography>
          <Typography variant="body2">
            5. from 1% to 2% is 150-300 score
          </Typography>
          <Typography variant="body2">
            6. from 2% to 5% is 50-150 score
          </Typography>
          <Typography variant="body2">
            7. from 5% to 100% is 0-50 score
          </Typography>

        </div>

        <div className="mx-2 my-2 px-4 py-4 rounded-2xl bg-[#2f384d4d]">
          <Box
            sx={{
              width: "100%",
              height: height,
            }}
          >
            <div className="flex flex-row justify-between">
              <Tabs
                value={role}
                onChange={(event: React.SyntheticEvent, newValue: string) => {
                  setRole(newValue);
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
              {pagination}
            </div>
            <StripedDataGrid
              rows={rowsToShow}
              getRowId={(row) => row.rank}
              columns={columns(region)}
              disableColumnMenu={true}
              hideFooter={true}
              sx={{ "&, [class^=MuiDataGrid]": { border: "none" } }}
              loading={loading}
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 100,
                  },
                },
                sorting: {
                  sortModel: [{ field: "total_score", sort: "desc" }],
                },
              }}
              pageSizeOptions={[100]}
              rowHeight={33.5}
              disableRowSelectionOnClick
              getRowClassName={(params) =>
                params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
              }
            />
          </Box>
          <div className="flex flex-row flex-row-reverse mt-1">
            {pagination}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MClassLeaderboard;
