import * as React from 'react';
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {generatePath} from 'react-router';

import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import {styled} from '@mui/system';
import MenuIcon from '@mui/icons-material/Menu';

import {borderColor, containerBg, headerButtonColor} from '../../theme';
import {EuIcon, UsIcon} from '../icons';
import {metaUrls, publicUrls} from '../../config';

import {TABS} from '../../constants/header';
import {REGIONS} from '../../constants/region';
import {getRegion} from '../../utils/urlparts';
import {BRACKETS} from '../../constants/pvp-activity';
import SearchBar from "../SearchBar";

const pages = Object.values(TABS);
const drawerWidth = 240;

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
  const handleOpenPage = ({activity, bracket}) => {
    const newPath = generatePath(publicUrls.page, { region, activity, bracket });
    navigate(newPath);
  };
  const host = window.location.host.toUpperCase();
  let clickMeta = () => {
    navigate("/" + region + '/meta' + window.location.search);
  }
  let clickLadder = () => {
    if (window.location.pathname.includes('meta')) {
      handleOpenPage({activity: 'ladder', bracket: BRACKETS.shuffle});
    } else {
      handleOpenPage({activity: 'ladder', bracket: bracket})
    }
  }
  let clickAcivity = () => {
    if (window.location.pathname.includes('meta')) {
      handleOpenPage({activity: 'activity', bracket: BRACKETS.shuffle});
    } else {
      handleOpenPage({activity: 'activity', bracket: bracket})
    }
  }
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };
  const navBarConfig = {
    tabs: [
      {
        label: 'Activity',
        handleClick: () => {
          handleOpenPage({activity: 'activity', bracket: bracket});
        }
      },
      {
        label: 'Ladder',
        handleClick: () => {
          handleOpenPage({activity: 'ladder', bracket: bracket});
        }
      },
      {
        label: 'Meta',
        handleClick: () => {
          clickMeta();
        }
      },
      {
        label: 'Play with Pro',
        handleClick: () => {
           window.open('https://secretshop.gg/wow/arena-rbg', "_blank")
        }
      }
    ]
  }
  let euBtn = <IconButton
    aria-label="eu"
    sx={region !== REGIONS.eu ? { filter: 'grayscale(100%)' } : {}}
    disableRipple
    onClick={() => handleSetRegion(REGIONS.eu)}
  >
    <EuIcon />
  </IconButton>;
  let naBtn = <IconButton
    aria-label="us"
    sx={region !== REGIONS.us ? {filter: 'grayscale(100%)'} : {}}
    disableRipple
    onClick={() => handleSetRegion(REGIONS.us)}
  >
    <UsIcon color="red"/>
  </IconButton>;
  let webSiteTypo = <Typography
    variant="h5"
    noWrap
    component="a"
    href="/"
    sx={{
      display: {xs: 'none', md: 'flex'},
      fontWeight: 700,
      letterSpacing: '.05rem',
      color: 'inherit',
      textDecoration: 'none',
      // paddingRight: '20px',
    }}
  >
    {host}
  </Typography>;
  let metaBtn = <Button
    onClick={clickMeta}
    sx={{color: headerButtonColor}}>
    Meta
  </Button>;
  let ladderBtn = <Button
    onClick={clickLadder}
    sx={{color: headerButtonColor}}>
    Ladder
  </Button>
  let activityBtn = <Button
    onClick={clickAcivity}
    sx={{color: headerButtonColor}}>
    Activity
  </Button>
  let header = <>
    <Grid container
          direction="row"
          justifyContent="space-between"
          alignItems="center">
      <Grid item xs={8}>
        <Box
            display={'flex'} alignItems={'center'} justifyContent="space-between">
          <Box sx={{}} width={'60%'} display={'flex'} alignItems={'center'} justifyContent="flex-start">
            {webSiteTypo}
            {activityBtn}
            {ladderBtn}
            {metaBtn}
            {<Button onClick={() => window.open('https://secretshop.gg/wow/arena-rbg', "_blank")} sx={{color: headerButtonColor}}>
            <Box display={'flex'} flexDirection={'column'} alignItems={'center'} justifyContent="center">
              <Typography variant={'inherit'}>
                Play with Pro
              </Typography>
              </Box>
            </Button>}
          </Box>
          <Box width={'40%'}>
            <SearchBar/>
          </Box>
        </Box>
      </Grid>
      <Grid item xs={1}>
        <Box display={'flex'} alignItems={'center'} justifyContent="flex-end">
          {euBtn}
          {naBtn}
        </Box>
      </Grid>
    </Grid>
  </>;
  if (isMobile) {
    header =
      <>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <SearchBar/>
        <Drawer variant="temporary"
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                  keepMounted: true, // Better open performance on mobile.
                }}
                sx={{
                  '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                }}>
          <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ my: 2 }}>
              {host}
            </Typography>
            <Divider />
            {euBtn}
            {naBtn}
            <List>
              {navBarConfig.tabs.map((tab) => (
                <ListItem key={tab.label} disablePadding>
                  <ListItemButton sx={{ textAlign: 'center' }} onClick={tab.handleClick}>
                    <ListItemText primary={tab.label} />
                  </ListItemButton>
                </ListItem>
              ))}

            </List>
          </Box>
        </Drawer>
      </>;
  }
  return (
    <StyledAppBar position="fixed">
      <Container maxWidth="xl">
        <StyledToolbar disableGutters>
          {header}
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Header;
