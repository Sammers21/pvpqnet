import { Tooltip } from "@mui/material";
import PlayersSearch from "@/components/SearchBar";
import RegionButtons from "./RegionButtons";
import BattleNetAccount from "./BattleNetAccount";

import { REGION } from "@/constants/region";
import { Link } from "react-router-dom";

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

const DesktopView = ({
  menuItems,
  host,
  region,
  setRegion,
  battleTag,
  isMeLoading,
}: IProps) => {
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
            const linkContent = (
              <span className="flex items-center gap-2">
                <span>{item.label}</span>
                {!item.isSpecial && item.badge ? (
                  <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-900">
                    {item.badge}
                  </span>
                ) : null}
              </span>
            );
            const linkClass = item.isSpecial
              ? "inline-flex items-center text-white font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-4 py-1.5 rounded-lg shadow-lg transition-all relative uppercase text-sm tracking-wide"
              : "inline-flex items-center px-2 py-1.5 text-[#60a5fa] hover:text-[#93c5fd] transition-colors uppercase text-sm font-medium tracking-wide";
            const button = item.external ? (
              <a
                key={item.label}
                href={item.href}
                target={item.label === "Widget" ? "_blank" : undefined}
                rel={
                  item.label === "Widget" ? "noopener noreferrer" : undefined
                }
                className={linkClass}
              >
                {linkContent}
                {item.isSpecial ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow-md leading-none">
                    NEW
                  </span>
                ) : null}
              </a>
            ) : (
              <Link key={item.label} to={item.href} className={linkClass}>
                {linkContent}
                {item.isSpecial ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[8px] font-bold px-1 py-0.5 rounded-full shadow-md leading-none">
                    NEW
                  </span>
                ) : null}
              </Link>
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
      <div className="flex items-center w-[450px] lg:w-[600px]">
        <PlayersSearch />
      </div>
      <div className="flex items-center justify-end mr-4 ml-4 gap-3">
        <BattleNetAccount
          battleTag={battleTag}
          isMeLoading={isMeLoading}
          variant="standalone"
        />
        <div className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl transition-all hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-md px-1 h-11 shrink-0 relative z-10">
          <RegionButtons region={region} setRegion={setRegion} />
        </div>
      </div>
    </div>
  );
};

export default DesktopView;
