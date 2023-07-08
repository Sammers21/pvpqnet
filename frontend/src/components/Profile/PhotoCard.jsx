import {aroundColor, borderColor, winRateGreyColor} from "../../theme";
import {alpha, Box, Button, Link, Typography} from "@mui/material";
import {getClassNameColor, getRealmColor} from "../DataTable/useColumns";
import LoadingButton from '@mui/lab/LoadingButton';
import dayjs from 'dayjs-ext'
import SaveIcon from '@mui/icons-material/Save';
import relativeTime from 'dayjs-ext/plugin/relativeTime'
import React from "react";

const PhotoCard = ({ data, update, loading }) => {
  dayjs.extend(relativeTime)
  var insert = ""
  if (data.media) {
    insert = data.media.insert;
  }
  const url = 'https://worldofwarcraft.blizzard.com/en-gb/character/' + data.region + '/' + data.realm + '/' + data.name;
  const ago = dayjs().to(dayjs(data.lastUpdatedUTCms ?? 0))
  let charInfoTypog = <Box
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
      <Link sx={{textDecoration: "none", boxShadow: "none"}}  href={url} color={getClassNameColor(data.class ?? "")}>{data.name}</Link>
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
  </Box>;
  let picture = <Box
    component="img"
    sx={{
      border: 1,
      borderColor: borderColor,
    }}
    alt="Pic"
    src={insert}
  />;

  let updButton;
  if (loading) {
    updButton = <LoadingButton sx={{p: 1, marginTop: 1,}} loading loadingPosition="start" startIcon={<SaveIcon/>} variant="outlined">Updating</LoadingButton>
  } else {
    updButton = <Button sx={{p: 1, marginTop: 1,}} variant="contained" onClick={() => update()}>Update now</Button>;
  }
  return (<Box
    display="flex"
    borderRadius={2}
    margin={1}
    padding={2}
    flexDirection={'row'}
    sx={{
      backgroundColor: alpha(aroundColor, 0.3),
    }}
  >
    {picture}
    {charInfoTypog}
    <Box sx={{
      width: '100%',
      p: 1,
      m: 1,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end'
    }}>
      <Box>
        <Typography>Last updated:</Typography>
        <Typography>{ago}</Typography>
        {updButton}
      </Box>
    </Box>
  </Box>);
}

export default PhotoCard;