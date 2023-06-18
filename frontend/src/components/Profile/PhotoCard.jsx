import {aroundColor, borderColor, winRateGreyColor} from "../../theme";
import {alpha, Box, Typography} from "@mui/material";
import {getClassNameColor, getRealmColor} from "../DataTable/useColumns";
import React from "react";

const PhotoCard = ({ data }) => {
  var insert = ""
  if (data.media) {
    insert = data.media.insert;
  }
  return (<Box
    display="flex"
    borderRadius={2}
    margin={1}
    padding={2}
    flexDirection={'row'}
    sx={{
      backgroundColor: alpha(aroundColor,0.3),
    }}
  >
    <Box
      component="img"
      sx={{
        border: 1,
        borderColor: borderColor,
      }}
      alt="Pic"
      src={insert}
    />
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        padding : '10px',
      }}
    >
      <Typography
        variant="h6"
        component="div"
        color={getClassNameColor(data.class ?? "")}>
        {data.name}
      </Typography>
      <Typography
        variant="h7"
        component="div"
        color={getRealmColor(data.fraction ?? "")}>
        {data.realm}
      </Typography>
      <Box display="flex">
        <Typography
          variant="h7"
          component="div"
          color={getRealmColor(data.fraction ?? "")} noWrap>
          {data.race }
        </Typography>
        <Typography variant="h7" color="inherit">
          &nbsp;
        </Typography>
        <Typography
          variant="h7"
          component="div"
          color={getClassNameColor(data.class ?? "")} noWrap>
          {data.activeSpec + " " + data.class}
        </Typography>
      </Box>
      <Typography
        variant="h7"
        component="div"
        color={winRateGreyColor} noWrap>
        {data.itemLevel + " equipped ilvl"}
      </Typography>
    </Box>
  </Box>);
}

export default PhotoCard;