import React from 'react';
import { Typography, Grid } from '@mui/material';

const BlizzardLoader = () => {
  return (
    <Grid
      className="loader-container"
      direction="column"
      sx={{ position: 'absolute', display: 'flex' }}
    >
      <div class="loader">
        <div class="blizzard-loader one"></div>
        <div class="blizzard-loader two"></div>
        <div class="blizzard-loader three"></div>
      </div>
      <Typography component="span">LOADING...</Typography>
    </Grid>
  );
};

export default BlizzardLoader;
