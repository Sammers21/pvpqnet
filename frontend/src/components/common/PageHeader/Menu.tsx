import * as React from 'react';
import { styled } from '@mui/material/styles';

import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { headerButtonColor, containerBg } from '../../../theme';
import type { ITabMenuOption, ITabMenuUrlOption } from '../../../types';

const StyledMenu = styled(Menu)({
  '& .MuiPaper-root': {
    backgroundColor: containerBg,
    borderRadius: 0,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 6,
    minWidth: 180,
    color: headerButtonColor,
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '0px 0',
    },
    '& .MuiMenuItem-root': {
      '&:hover': {
        backgroundColor: 'rgba(144, 202, 249, 0.08)',
      },
    },
  },
});

const StyledButton = styled(Button)({
  '& .MuiButton-endIcon': {
    marginLeft: 4,
  },
});

interface IProps {
  label: string;
  options: ITabMenuOption[];
  handleOpenPage: (option: ITabMenuUrlOption) => void;
}

const HeaderMenu = ({ label, options, handleOpenPage }: IProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const selectOption = (urlOptions: ITabMenuUrlOption) => {
    handleCloseMenu();

    handleOpenPage(urlOptions);
  };

  return (
    <div>
      <StyledButton
        sx={{
          display: 'flex',
          flexWrap: 'nowrap',
          my: 2,
          fontSize: 14,
          color: headerButtonColor,
          borderRadius: 0,
          margin: '0px',
          padding: '12px 8px',
        }}
        disableElevation
        onClick={handleOpenMenu}
        endIcon={<KeyboardArrowDownIcon />}
      >
        {label}
      </StyledButton>

      <StyledMenu anchorEl={anchorEl} open={open} onClose={handleCloseMenu}>
        {options.map(({ label, urlOptions }) => (
          <MenuItem key={label} onClick={() => selectOption(urlOptions)} disableRipple>
            {label}
          </MenuItem>
        ))}
      </StyledMenu>
    </div>
  );
};

export default HeaderMenu;
