import { useState } from "react";

import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import PlayersSearch from "@/components/SearchBar";
import RegionButtons from "./RegionButtons";
import BattleNetAccount from "./BattleNetAccount";
import { Link } from "react-router-dom";

import { REGION } from "@/constants/region";

interface IProps {
  host: string;
  menuItems: {
    label: string;
    href: string;
    external?: boolean;
    isSpecial?: boolean;
    badge?: string;
  }[];
  region: REGION;
  setRegion: (r: REGION) => void;
  battleTag: string | null;
  isMeLoading: boolean;
}

const MobileView = ({
  menuItems,
  host,
  region,
  setRegion,
  battleTag,
  isMeLoading,
}: IProps) => {
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

          <div className="flex justify-center my-4">
            <BattleNetAccount
              battleTag={battleTag}
              isMeLoading={isMeLoading}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>

          <RegionButtons region={region} setRegion={setRegion} />

          <List>
            {menuItems.map((item) => {
              const linkContent = (
                <>
                  <span className="flex items-center justify-center gap-2 w-full py-2">
                    <span>{item.label}</span>
                    {!item.isSpecial && item.badge ? (
                      <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-900">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                  {item.isSpecial ? (
                    <span className="absolute -top-1 right-2 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow-md leading-none">
                      NEW
                    </span>
                  ) : null}
                </>
              );
              const linkClass = item.isSpecial
                ? "block w-full text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-lg mx-2 my-1 uppercase text-sm tracking-wide"
                : "block w-full text-center text-[#60a5fa] hover:bg-white/5 uppercase text-sm font-medium tracking-wide";
              const listItem = (
                <ListItem
                  key={item.label}
                  disablePadding
                  className={item.isSpecial ? "!relative" : ""}
                >
                  {item.external ? (
                    <a
                      href={item.href}
                      target={item.label === "Widget" ? "_blank" : undefined}
                      rel={
                        item.label === "Widget"
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className={linkClass}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {linkContent}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className={linkClass}
                      onClick={() => setDrawerOpen(false)}
                    >
                      {linkContent}
                    </Link>
                  )}
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
                        background:
                          "linear-gradient(135deg, #9333ea 0%, #3b82f6 100%)",
                        boxShadow: "0 10px 25px rgba(147, 51, 234, 0.4)",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                        maxWidth: "280px",
                        backdropFilter: "blur(10px)",
                      },
                    },
                    arrow: {
                      sx: {
                        color: "#9333ea",
                        "&::before": {
                          border: "1px solid rgba(255, 255, 255, 0.2)",
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
