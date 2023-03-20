import * as React from 'react';

import { AppBar, Box, Toolbar, Typography, Container, Grid, IconButton } from '@mui/material';
import { borderColor, containerBg } from '../../theme';
import { TABS_MENU, TABS } from '../../constants/header';
import HeaderMenu from '../HeaderMenu';
import { EuIcon, UsIcon } from '../icons';
import { styled } from '@mui/system';

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
              <HeaderMenu key={page} label={page} options={TABS_MENU[page]} />
            ))}
          </Box>

          <Grid>
            <IconButton aria-label="us" color="secondary">
              <UsIcon />
            </IconButton>
            <IconButton aria-label="eu" color="secondary">
              <EuIcon />
            </IconButton>
          </Grid>
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default PageHeader;
