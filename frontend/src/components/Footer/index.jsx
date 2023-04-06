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
        <span> </span>&<span> </span>
        <Link underline="none" href="https://github.com/Starmordar">
          Starmordar
        </Link>
      </Grid>

      <Link
        sx={{ display: 'flex' }}
        underline="none"
        href="https://github.com/Sammers21/wow-pla/issues"
      >
        Have a problem? Report here
        <GitHubIcon sx={{ marginLeft: '8px' }} />
      </Link>
    </Grid>
  );
};

export default Footer;
