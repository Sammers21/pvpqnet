import React from "react";
import { Box, Typography, Divider, Link } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { aroundColor, borderRadius, containerBg } from "../../theme";
import { profileUrl, getClassNameColor } from "../DataTable/useColumns";
import { DataGrid } from "@mui/x-data-grid";
import { ratingToColor } from "./PvpBracketBox";

const Alts = ({ isMobile, alts }) => {
  if (alts === undefined) {
    alts = [];
  }
  if (alts.length === 0) {
    return <></>;
  }

  const nameRender = (params) => {
    const alt = params.row;
    const name = alt.name;
    const realm = alt.realm;
    const url = profileUrl(alt, alt.region);
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography color={getClassNameColor(alt.class)}>
          <Link
            sx={{ textDecoration: "none", boxShadow: "none" }}
            href={url}
            color={getClassNameColor(alt.class)}
          >
            {name}-{realm}
          </Link>
        </Typography>
      </Box>
    );
  };

  const renderNumber = (number) => {
    if(number === undefined) {
      number = 0;
    }
    let color = ratingToColor(number);
    return <Typography color={color}>{number}</Typography>;
  };

  const bracketRender = (bracket) => (params) => {
    const alt = params.row;
    let findQuery;
    if (bracket === "shuffle") {
      findQuery = (b) => b.bracket_type.startsWith("SHUFFLE");
    } else if (bracket === "2v2") {
      findQuery = (b) => b.bracket_type === "ARENA_2v2";
    } else if (bracket === "3v3") {
      findQuery = (b) => b.bracket_type === "ARENA_3v3";
    } else if (bracket === "rbg") {
      findQuery = (b) => b.bracket_type === "BATTLEGROUNDS";
    } else {
        console.error("Unknown bracket: " + bracket);
    }
    let found = (alt?.brackets ?? []).filter(findQuery);
    let max = 0;
    if(found.length > 0) {
      max = Math.max(...found.map((bracket) => bracket.rating));
    }
    return renderNumber(max);
  };

  const renderHdr = (title) => () => {
    return (
      <Typography variant={"h6"} sx={{ textAlign: "center" }}>
        {title}
      </Typography>
    );
  };

  const columns = [
    {
      field: "id",
      headerName: "Name",
      renderCell: nameRender,
      width: 200,
      renderHeader: renderHdr("Name"),
    },
    {
      field: "SHUFFLE",
      headerName: "Shuffle",
      width: 200,
      renderCell: bracketRender("shuffle"),
      renderHeader: renderHdr("Shuffle"),
    },
    {
      field: "ARENA_2v2",
      headerName: "2v2",
      renderCell: bracketRender("2v2"),
      renderHeader: renderHdr("2v2"),
    },
    {
      field: "ARENA_3v3",
      headerName: "3v3",
      renderCell: bracketRender("3v3"),
      renderHeader: renderHdr("3v3"),
    },
    {
      field: "BATTLEGROUNDS",
      headerName: "RBG",
      renderCell: bracketRender("rbg"),
      renderHeader: renderHdr("RBG"),
    },
  ];

  const explodedAlts = alts.map((alt) => {
    alt.brackets.forEach((bracket) => {
      if (bracket.bracket_type.startsWith("SHUFFLE")) {
        let cur = alt["SHUFFLE"]
        if (cur === undefined) {
          cur = 0;
        }
        alt["SHUFFLE"] = Math.max(cur, bracket.rating);
      } else {
        alt[bracket.bracket_type] = bracket.rating;
      }
    });
    ["SHUFFLE", "ARENA_2v2", "ARENA_3v3", "BATTLEGROUNDS"].forEach((bracket) => {
      if(alt[bracket] === undefined) {
        alt[bracket] = 0;
      }
    });
    return alt;
  });

  return (
    <>
      <Box
        sx={{
          backgroundColor: alpha(aroundColor, 0.3),
          borderRadius: borderRadius,
          marginTop: "15px",
          marginBottom: "15px",
          width: "100%",
          paddingTop: "15px",
          paddingBottom: "15px",
          paddingLeft: "15px",
          paddingRight: "15px",
        }}
      >
        <Typography variant={"h5"}>Alts</Typography>
        <Divider sx={{ marginBottom: "10px" }} />
        <DataGrid
          rows={explodedAlts}
          columns={columns}
          getRowId={(row) => {
            return row.id;
          }}
          sx={{
            "&, [class^=MuiDataGrid]": { border: "none" },
          }}
          hideFooter={true}
          disableColumnMenu={true}
          disableRowSelectionOnClick
        />
      </Box>
    </>
  );
};

export default Alts;
