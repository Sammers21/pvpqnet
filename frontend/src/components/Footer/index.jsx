import React from 'react';
import {Grid, Link} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

const Footer = () => {
  return (
    <Grid
      sx={{
        position: 'fixed',
        display: 'flex',
        justifyContent: 'space-between',
        bottom: 0,
        left: 0,
        padding: '6px 32px',
        border: '1px #2f384de6 solid',
        background: '#141415',
        width: '100%',
      }}
    >
      <Grid>
        Made by<span> </span>
        <Link underline="none" href="https://github.com/Sammers21">
          Sammers
        </Link>
      </Grid>

      <Link
        sx={{ display: 'flex' }}
        underline="none"
        href="https://github.com/Sammers21/pvpqnet"
      >
        Please consider giving our GitHub project a star if you find it helpful. Thank you!
        <GitHubIcon sx={{ marginLeft: '8px' }} />
      </Link>
    </Grid>
  );
};

export default Footer;
