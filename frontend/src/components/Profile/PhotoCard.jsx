import { aroundColor, borderColor, borderRadius, winRateGreyColor } from '../../theme';
import { alpha, Box, Button, Link, Typography } from '@mui/material';
import { getClassNameColor, getRealmColor } from '../../utils/table';
import LoadingButton from '@mui/lab/LoadingButton';
import dayjs from 'dayjs-ext';
import SaveIcon from '@mui/icons-material/Save';
import relativeTime from 'dayjs-ext/plugin/relativeTime';
import React from 'react';
import UpdateButton from './UpdateButton';

const PhotoCard = ({ isMobile, data, update, loading }) => {
  dayjs.extend(relativeTime);
  var insert = '';
  if (data.media) {
    insert = data.media.insert;
  }
  let realm = data.realm;
  if (realm !== undefined) {
    realm = realm.replaceAll(' ', '-').replaceAll("'", '');
  }
  const url =
    'https://worldofwarcraft.blizzard.com/en-gb/character/' +
    data.region +
    '/' +
    realm +
    '/' +
    data.name;
  const ago = dayjs().to(dayjs(data.lastUpdatedUTCms ?? 0));

  let charInfoTypog = (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        padding: '10px',
      }}
    >
      <Typography variant="h6" component="div" color={getClassNameColor(data.class ?? '')}>
        <Link
          sx={{ textDecoration: 'none', boxShadow: 'none' }}
          href={url}
          color={getClassNameColor(data.class ?? '')}
        >
          {data.name}
        </Link>
      </Typography>
      <Typography variant="h7" component="div" color={getRealmColor(data.fraction ?? '')}>
        {data.realm}
      </Typography>
      <Box display="flex">
        <Typography variant="h7" component="div" color={getRealmColor(data.fraction ?? '')} noWrap>
          {data.race}
        </Typography>
        <Typography variant="h7" color="inherit">
          &nbsp;
        </Typography>
        <Typography variant="h7" component="div" color={getClassNameColor(data.class ?? '')} noWrap>
          {data.activeSpec + ' ' + data.class}
        </Typography>
      </Box>
      <Typography variant="h7" component="div" color={winRateGreyColor} noWrap>
        {data.itemLevel + ' equipped ilvl'}
      </Typography>
    </Box>
  );

  let picture = (
    <Box
      width={isMobile ? '170px' : '200px'}
      height={'100%'}
      si
      component="img"
      sx={{
        border: 1,
        borderColor: borderColor,
      }}
      alt="Profile-pic"
      src={insert}
    />
  );

  let upd = () => update();
  let updButton = <UpdateButton loading={loading} update={upd} />;

  return (
    <Box
      width={isMobile ? '100%' : 'auto'}
      display="flex"
      borderRadius={borderRadius}
      margin={isMobile ? 0 : 3}
      padding={isMobile ? 0 : 3}
      flexDirection={isMobile ? 'column' : 'row'}
      sx={{
        backgroundColor: alpha(aroundColor, 0.3),
      }}
    >
      <Box display={'flex'} flexDirection={'row'}>
        {picture}
        {charInfoTypog}
      </Box>
      <Box
        sx={{
          width: '100%',
          p: 1,
          m: 1,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
        }}
      >
        <Box>
          <Typography>Last updated:</Typography>
          <Typography>{ago}</Typography>
          {updButton}
        </Box>
      </Box>
    </Box>
  );
};

export default PhotoCard;
