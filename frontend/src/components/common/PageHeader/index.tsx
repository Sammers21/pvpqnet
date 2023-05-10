import { useNavigate, useParams } from 'react-router-dom';
import { generatePath } from 'react-router';

import AppBar from '@mui/material/AppBar';
import Container from '@mui/material/Container';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';

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

  const host = window.location.host.toUpperCase();
  const region = getRegion(regionFromUrl);

  const handleSetRegion = (region: REGION) => {
    const newPath = generatePath(publicUrls.activity, { region, activity, bracket });
    navigate(newPath);
  };

  const handleOpenPage = ({ activity, bracket }: ITabMenuUrlOption) => {
    const newPath = generatePath(publicUrls.activity, { region, activity, bracket });
    navigate(newPath);
  };

  return (
    <StyledAppBar position="fixed">
      <Container maxWidth="xl">
        <StyledToolbar disableGutters>
          <a href="/" className="sm:flex hidden mr-10 font-bold tracking-wider text-xl">
            {host}
          </a>

          <div className="flex flex-1">
            {pages.map((page) => (
              <Menu
                key={page}
                label={page}
                options={TABS_MENU[page]}
                handleOpenPage={handleOpenPage}
              />
            ))}
          </div>

          <div>
            <IconButton
              aria-label="eu"
              className={`${region !== REGION.eu ? 'grayscale' : ''}`}
              disableRipple
              onClick={() => handleSetRegion(REGION.eu)}
            >
              <EuIcon />
            </IconButton>

            <IconButton
              aria-label="us"
              className={`${region !== REGION.us ? 'grayscale' : ''}`}
              disableRipple
              onClick={() => handleSetRegion(REGION.us)}
            >
              <UsIcon />
            </IconButton>
          </div>
        </StyledToolbar>
      </Container>
    </StyledAppBar>
  );
};

export default PageHeader;
