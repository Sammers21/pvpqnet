import { useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { generatePath } from 'react-router';
import { createBreakpoint } from 'react-use';

import { AppBar, Container, Toolbar } from '@mui/material';
import { styled } from '@mui/system';
import MobileView from './MobileView';
import DesktopView from './DesktopView';

import { borderColor, containerBg } from '@/theme';
import { metaUrls, publicUrls } from '@/config';
import { REGIONS } from '@/constants/region';
import { BRACKETS } from '@/constants/pvp-activity';
import { getRegion } from '@/utils/urlparts';

const StyledAppBar = styled(AppBar)({
  backgroundImage: 'none',
  backgroundColor: `${containerBg} !important`,
  boxShadow: '0 0 #0000,0 0 #0000,0px 0px 15px 0 rgba(0, 0, 0, 1)',
  borderColor: borderColor,
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '48px !important',
});

const useBreakpoint = createBreakpoint({ S: 758, L: 900, XL: 1280 });

const Header = () => {
  let navigate = useNavigate();
  const location = useLocation();
  const host = window.location.host.toUpperCase();
  const {
    region: regionFromUrl = REGIONS.eu,
    activity = 'activity',
    bracket = BRACKETS.shuffle,
  } = useParams();
  const region = getRegion(regionFromUrl);
  const breakpoint = useBreakpoint();

  const isMetaPage = useMemo(() => location.pathname.includes('meta'), [location]);

  function handleSetRegion(region: REGIONS) {
    const newPath = isMetaPage
      ? generatePath(metaUrls.page, { region })
      : generatePath(publicUrls.page, { region, activity, bracket });

    navigate(newPath + window.location.search);
  }

  function navigateToPage({ activity, bracket }: { activity: string; bracket: string }) {
    const newPath = generatePath(publicUrls.page, { region, activity, bracket });
    navigate(newPath);
  }

  function redirectToMeta() {
    navigate('/' + region + '/meta' + window.location.search);
  }

  function redirectToLadder() {
    navigateToPage({ activity: 'ladder', bracket: isMetaPage ? BRACKETS.shuffle : bracket });
  }

  function redirectToActivity() {
    navigateToPage({ activity: 'activity', bracket: isMetaPage ? BRACKETS.shuffle : bracket });
  }

  function redirectToShop() {
    window.open('https://secretshop.gg/wow/arena-rbg', '_blank');
  }

  const menuItems = [
    { label: 'Activity', onClick: redirectToActivity },
    { label: 'Leaderboards', onClick: redirectToLadder },
    { label: 'Meta', onClick: redirectToMeta },
    // { label: 'Coaching', onClick: redirectToShop },
  ];

  const View = breakpoint === 'S' ? MobileView : DesktopView;
  return (
    <StyledAppBar position="fixed">
      <Container maxWidth="xl">
        <StyledToolbar disableGutters>
          <View region={region} setRegion={handleSetRegion} menuItems={menuItems} host={host} />
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Header;
