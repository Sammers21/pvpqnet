import { Button, Tooltip } from "@mui/material";
import PlayersSearch from "@/components/SearchBar";
import RegionButtons from "./RegionButtons";

import { REGION } from "@/constants/region";
import { Link } from "react-router-dom";

interface IProps {
  host: string;
  menuItems: { label: string; onClick: () => void; isSpecial?: boolean }[];
  region: REGION;
  setRegion: (r: REGION) => void;
}

const DesktopView = ({ menuItems, host, region, setRegion }: IProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center justify-start">
        <div className="flex items-center justify-start">
          <Link
            to={"/"}
            className="sm:flex hidden ml-20 mr-5 font-bold tracking-wider text-xl items-center gap-2"
          >
            <img
              src="/icons/128x128.png"
              alt="site icon"
              width={40}
              height={40}
              className="inline-block"
            />
            {host}
          </Link>

          {menuItems.map((item) => {
            const button = (
              <Button
                key={item.label}
                className={
                  item.isSpecial
                    ? "!text-white !font-semibold !bg-gradient-to-r !from-purple-500 !to-blue-500 hover:!from-purple-600 hover:!to-blue-600 !px-4 !py-1.5 !rounded-lg !shadow-lg !transition-all !relative"
                    : "!text-[#60a5fa]"
                }
                onClick={item.onClick}
              >
                {item.label}
                {item.isSpecial && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                    NEW
                  </span>
                )}
              </Button>
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
                {button}
              </Tooltip>
            ) : (
              button
            );
          })}
        </div>
      </div>
      <div className="flex items-center w-[356px]">
        <PlayersSearch />
      </div>
      <div className="flex items-center justify-end mr-20">
        <RegionButtons region={region} setRegion={setRegion} />
      </div>
    </div>
  );
};

export default DesktopView;
