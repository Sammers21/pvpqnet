import { useNavigate, useParams } from 'react-router-dom';
import { generatePath } from 'react-router';

import { AppBar, Box, Container, Grid, IconButton, Toolbar, Typography } from '@mui/material';
import { styled } from '@mui/system';

import { borderColor, containerBg } from '../../../theme';
import { EuIcon, UsIcon } from '../icons';
import Menu from './Menu';

import { TABS, TABS_MENU } from '../../../constants/pageHeader';
import { REGION, BRACKET, ACTIVITY } from '../../../constants';
import { getRegion } from '../../../utils/getFromUrl';

import { publicUrls } from '../../../config';

import type { ITabMenuUrlOption } from '../../../types';

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
  const {
    region: regionFromUrl,
    activity = ACTIVITY.activity,
    bracket = BRACKET.shuffle,
  } = useParams();
  const region = getRegion(regionFromUrl);

  const handleSetRegion = (region: REGION) => {
    const newPath = generatePath(publicUrls.activity, { region, activity, bracket });
    navigate(newPath);
  };

  const handleOpenPage = ({ activity, bracket }: ITabMenuUrlOption) => {
    const newPath = generatePath(publicUrls.activity, { region, activity, bracket });
    navigate(newPath);
  };

  const host = window.location.host.toUpperCase();
  return (
    <StyledAppBar position="fixed">
      <Container maxWidth="xl">
        <StyledToolbar disableGutters>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              letterSpacing: '.05rem',
              color: 'inherit',
              textDecoration: 'none',
              marginRight: '40px',
            }}
          >
            {host}
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Menu
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
              sx={region !== REGION.eu ? { filter: 'grayscale(100%)' } : {}}
              disableRipple
              onClick={() => handleSetRegion(REGION.eu)}
            >
              <EuIcon />
            </IconButton>
            <IconButton
              aria-label="us"
              sx={region !== REGION.us ? { filter: 'grayscale(100%)' } : {}}
              disableRipple
              onClick={() => handleSetRegion(REGION.us)}
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
