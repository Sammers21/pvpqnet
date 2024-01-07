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
import PlayersSearch from '@/components/SearchBar';
import RegionButtons from './RegionButtons';

import { REGION } from '@/constants/region';

interface IProps {
  host: string;
  menuItems: { label: string; onClick: () => void }[];
  region: REGION;
  setRegion: (r: REGION) => void;
}

const MobileView = ({ menuItems, host, region, setRegion }: IProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <IconButton edge="start" className="!ml-1 !mr-3" onClick={() => setDrawerOpen((state) => !state)}>
        <MenuIcon />
      </IconButton>

      <PlayersSearch />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="!w-60"
        sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }}
      >
        <div className="text-center" onClick={() => setDrawerOpen((state) => !state)}>
          <h6 className="my-4 text-xl font-semibold	">{host}</h6>
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
