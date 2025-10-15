import { useState } from "react";

import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PlayersSearch from "@/components/SearchBar";
import RegionButtons from "./RegionButtons";

import { REGION } from "@/constants/region";

interface IProps {
  host: string;
  menuItems: { label: string; onClick: () => void; isSpecial?: boolean }[];
  region: REGION;
  setRegion: (r: REGION) => void;
}

const MobileView = ({ menuItems, host, region, setRegion }: IProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <IconButton
        edge="start"
        className="!ml-1 !mr-3"
        onClick={() => setDrawerOpen((state) => !state)}
      >
        <MenuIcon />
      </IconButton>

      <PlayersSearch />

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="!w-60"
        sx={{ "& .MuiDrawer-paper": { boxSizing: "border-box", width: 240 } }}
      >
        <div
          className="text-center"
          onClick={() => setDrawerOpen((state) => !state)}
        >
          <h6 className="my-4 text-xl font-semibold	 flex items-center justify-center gap-2">
            <img
              src="/icons/128x128.png"
              alt="site icon"
              width={40}
              height={40}
              className="inline-block"
            />
            {host}
          </h6>
          <Divider />

          <RegionButtons region={region} setRegion={setRegion} />

          <List>
            {menuItems.map((item) => {
              const listItem = (
                <ListItem
                  key={item.label}
                  disablePadding
                  className={item.isSpecial ? "!relative" : ""}
                >
                  <ListItemButton
                    sx={{ textAlign: "center" }}
                    onClick={item.onClick}
                    className={
                      item.isSpecial
                        ? "!bg-gradient-to-r !from-purple-500 !to-blue-500 !text-white !font-semibold !rounded-lg !mx-2 !my-1"
                        : ""
                    }
                  >
                    <ListItemText primary={item.label} />
                    {item.isSpecial && (
                      <span className="absolute top-0 right-4 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                        NEW
                      </span>
                    )}
                  </ListItemButton>
                </ListItem>
              );
              return item.isSpecial ? (
                <Tooltip
                  key={item.label}
                  title={
                    <div className="p-3">
                      <div className="font-bold text-base mb-2 text-white">
                        ✨ AI-Powered Arena Analysis
                      </div>
                      <div className="text-sm mb-3 text-white/90 leading-relaxed">
                        Get personalized feedback on your gameplay
                      </div>
                      <div className="text-sm space-y-1.5 text-white/95">
                        <div className="flex items-center gap-1.5">
                          <span className="text-yellow-300">✓</span>
                          <span>Trained by 20+ AWC & R1 Players</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-yellow-300">✓</span>
                          <span>10 Analysis Aspects</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-yellow-300">✓</span>
                          <span>0-100 Performance Score</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-yellow-300">✓</span>
                          <span>Powered by OpenAI, Anthropic, xAI</span>
                        </div>
                      </div>
                    </div>
                  }
                  arrow
                  placement="right"
                  enterDelay={300}
                  leaveDelay={200}
                  componentsProps={{
                    tooltip: {
                      sx: {
                        background: 'linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)',
                        boxShadow: '0 10px 25px rgba(147, 51, 234, 0.4)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        maxWidth: '280px',
                        backdropFilter: 'blur(10px)',
                      },
                    },
                    arrow: {
                      sx: {
                        color: '#9333ea',
                        '&::before': {
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        },
                      },
                    },
                  }}
                >
                  {listItem}
                </Tooltip>
              ) : (
                listItem
              );
            })}
          </List>
        </div>
      </Drawer>
    </>
  );
};

export default MobileView;
