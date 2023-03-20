import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generatePath } from 'react-router';

import { AppBar, Box, Toolbar, Typography, Container, Grid, IconButton } from '@mui/material';
import { styled } from '@mui/system';

import { borderColor, containerBg } from '../../theme';
import { EuIcon, UsIcon } from '../icons';
import HeaderMenu from '../HeaderMenu';
import { publicUrls } from '../../config';

import { TABS_MENU, TABS } from '../../constants/header';
import { REGIONS } from '../../constants/region';
import { getRegion } from '../../utils/getRegion';

const pages = Object.values(TABS);

const StyledAppBar = styled(AppBar)({
  backgroundImage: 'none',
  backgroundColor: `${containerBg} !important`,
  boxShadow: '0 0 #0000,0 0 #0000,0px 0px 15px 0 rgba(0, 0, 0, 1)',
  borderColor: borderColor,
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '48px !important',
});

const PageHeader = () => {
  let navigate = useNavigate();
  const { region: regionFromUrl, activity, discipline } = useParams();
  const region = getRegion(regionFromUrl);

  const handleSetRegion = (region) => {
    const newPath = generatePath(publicUrls.page, { region, activity, discipline });
    navigate(newPath);
  };

  const handleOpenPage = ({ activity, discipline }) => {
    const newPath = generatePath(publicUrls.page, { region, activity, discipline });
    navigate(newPath);
  };

  return (
    <StyledAppBar position="static">
      <Container maxWidth="xl">
        <StyledToolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
              marginRight: '40px',
            }}
          >
            PVPQ.NET
          </Typography>

          <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            LOGO
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <HeaderMenu
                key={page}
                label={page}
                options={TABS_MENU[page]}
                handleOpenPage={handleOpenPage}
              />
            ))}
          </Box>

          <Grid>
            <IconButton
              aria-label="eu"
              sx={region !== REGIONS.eu ? { filter: 'grayscale(100%)' } : {}}
              disableRipple
              onClick={() => handleSetRegion(REGIONS.eu)}
            >
              <EuIcon />
            </IconButton>
            <IconButton
              aria-label="us"
              sx={region !== REGIONS.us ? { filter: 'grayscale(100%)' } : {}}
              disableRipple
              onClick={() => handleSetRegion(REGIONS.us)}
            >
              <UsIcon color="red" />
            </IconButton>
          </Grid>
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default PageHeader;
