import { useState } from 'react';

import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

import { REGIONS } from '../../constants/region';
import SearchBar from '../SearchBar';
import RegionButtons from './RegionButtons';

interface IProps {
  host: string;
  menuItems: { label: string; onClick: () => void }[];
  region: REGIONS;
  setRegion: (r: REGIONS) => void;
}

const MobileView = ({ menuItems, host, region, setRegion }: IProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <IconButton edge="start" className="!mr-3" onClick={() => setDrawerOpen((state) => !state)}>
        <MenuIcon />
      </IconButton>

      <SearchBar />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} className="w-60">
        <div onClick={() => setDrawerOpen((state) => !state)}>
          <h6 className="my-2">{host}</h6>
          <Divider />

          <RegionButtons region={region} setRegion={setRegion} />

          <List>
            {menuItems.map((item) => (
              <ListItem key={item.label} disablePadding>
                <ListItemButton sx={{ textAlign: 'center' }} onClick={item.onClick}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>
    </>
  );
};

export default MobileView;
