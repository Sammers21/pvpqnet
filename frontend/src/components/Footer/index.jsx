import React, {useEffect, useState} from 'react';
import {Grid, Link} from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';

const Footer = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    window.addEventListener('resize', function () {
      setWidth(window.innerWidth);
    });
    return () => {
      window.removeEventListener('resize', function () {
        setWidth(window.innerWidth);
      });
    }
  }, []);
  const isMobile = width <= 900;
  let justifyContent = 'space-between';
  if (isMobile) {
    justifyContent = 'center';
  }
  let madeBySammers = <Grid>
    Made by<span> </span>
    <Link underline="none" href="https://github.com/Sammers21">
      Sammers
    </Link>
  </Grid>;
  let giveItAStar = <Link
  sx={{ textDecoration: "none", boxShadow: "none", display: 'flex' }}
    underline="none"
    href="https://github.com/Sammers21/pvpqnet"
  >
    Source Code
    <GitHubIcon sx={{marginLeft: '8px'}}/>
  </Link>;
  return (
    <Grid
      sx={{
        position: 'fixed',
        display: 'flex',
        justifyContent: justifyContent,
        bottom: 0,
        left: 0,
        padding: '6px 32px',
        border: '1px #2f384de6 solid',
        background: '#141415',
        width: '100%',
      }}
    >
      {madeBySammers}
      { !isMobile && giveItAStar}
    </Grid>
  );
};

export default Footer;
