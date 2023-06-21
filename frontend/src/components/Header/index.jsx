import * as React from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {generatePath} from 'react-router';

import {AppBar, Box, Button, Container, Grid, IconButton, Toolbar, Typography} from '@mui/material';
import {styled} from '@mui/system';

import {borderColor, containerBg, headerButtonColor} from '../../theme';
import {EuIcon, UsIcon} from '../icons';
import HeaderMenu from '../HeaderMenu';
import {metaUrls, publicUrls} from '../../config';

import {TABS, TABS_MENU} from '../../constants/header';
import {REGIONS} from '../../constants/region';
import {getRegion} from '../../utils/urlparts';
import {BRACKETS} from '../../constants/pvp-activity';
import SearchBar from "../SearchBar";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

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

const Header = () => {
  let navigate = useNavigate();
  const {
    region: regionFromUrl = REGIONS.eu,
    activity = 'activity',
    bracket = BRACKETS.shuffle,
  } = useParams();
  console.log('region from url', regionFromUrl)
  const region = getRegion(regionFromUrl);

  const handleSetRegion = (region) => {
    let newPath;
    if (window.location.pathname.includes('meta')) {
      newPath = generatePath(metaUrls.page, {region});
    } else {
      newPath = generatePath(publicUrls.page, {region, activity, bracket});
    }
    navigate(newPath + window.location.search);
  };

  const handleOpenPage = ({activity, bracket}) => {
    const newPath = generatePath(publicUrls.page, { region, activity, bracket });
    navigate(newPath);
  };
  const host = window.location.host.toUpperCase();
  let clickMeta = () => {
    navigate("/" + region + '/meta' + window.location.search);
  }
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
              <HeaderMenu
                key={page}
                label={page}
                options={TABS_MENU[page]}
                handleOpenPage={handleOpenPage}
              />
            ))}
            <Button onClick={clickMeta} sx={{ color: headerButtonColor }}>
              Meta
            </Button>
          </Box>
          <Grid direction="column">
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
            <SearchBar/>
          </Grid>
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Header;
