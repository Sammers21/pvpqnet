import { openWowArmory } from "@/utils/urlparts";
import { PlayerItemLvl, PlayerImages, PlayerName } from "./common";

import type { Player } from "@/types";
import { CircularProgress, Tooltip } from "@mui/material";
import { useState, useEffect } from "react";
import GearModal from "../GearModal";

// Icons
import ShieldIcon from "@mui/icons-material/Shield";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";

interface IProps {
  player: Player;
  openArmory?: () => void;
}

const PlayerImage = ({
  player,
  onGearClick,
  onTalentsClick,
}: IProps & { onGearClick: () => void; onTalentsClick: () => void }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!player.media.main_raw) return;
    const playerImage = new Image();
    playerImage.src = player.media.main_raw;
    playerImage.onload = () => {
      setIsLoaded(true);
    };
  }, [player]);
  const handleOpenArmory = () => {
    openWowArmory(player);
  };
  if (!player.media.main_raw) {
    return (
      <div className="relative w-[300px] h-full">
        <div className="smoke-bg absolute left-0 top-0 w-full h-full bg-cover bg-no-repeat rounded-xl opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
        <div className="w-full h-full flex justify-center items-center min-h-[415px]" />
      </div>
    );
  }
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="smoke-bg absolute left-0 top-0 w-[300px] h-full bg-cover bg-no-repeat rounded-xl opacity-40" />
      {player.media?.main_raw && isLoaded ? (
        <>
          <img
            className="-scale-x-100 w-full h-full object-cover select-none"
            alt={`${player.name} - ${player.realm}`}
            src={player.media.main_raw}
          />
          {/* Gradient overlays for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-transparent to-slate-900/80 pointer-events-none" />

          {/* Hover overlay with action buttons */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm" />

            {/* Action buttons */}
            <div className="relative z-10 flex flex-col gap-3">
              <Tooltip title="View equipped gear" placement="right">
                <button
                  onClick={onGearClick}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#60A5FA] to-[#3b82f6] text-white font-semibold text-sm hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-[#60A5FA40] hover:scale-105"
                >
                  <ShieldIcon sx={{ fontSize: 18 }} />
                  VIEW GEAR
                </button>
              </Tooltip>

              <Tooltip title="View talents & PvP talents" placement="right">
                <button
                  onClick={onTalentsClick}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-[#a855f7] to-[#7c3aed] text-white font-semibold text-sm hover:brightness-110 transition-all duration-200 shadow-lg hover:shadow-[#a855f740] hover:scale-105"
                >
                  <AutoAwesomeMotionIcon sx={{ fontSize: 18 }} />
                  OPEN TALENTS
                </button>
              </Tooltip>

              <Tooltip title="Open character on WoW Armory" placement="right">
                <button
                  onClick={handleOpenArmory}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-600/50 text-slate-200 font-semibold text-sm hover:border-sky-500/50 hover:bg-slate-700/80 transition-all duration-200"
                >
                  <OpenInNewIcon sx={{ fontSize: 18 }} />
                  OPEN ARMORY
                </button>
              </Tooltip>
            </div>
          </div>
        </>
      ) : (
        <div className="w-[300px] h-full min-h-[415px] flex justify-center items-center">
          <CircularProgress sx={{ color: "#60A5FA" }} />
        </div>
      )}
    </div>
  );
};

const PlayerCard = ({ player }: IProps) => {
  const [gearModalOpen, setGearModalOpen] = useState(false);
  const [gearModalTab, setGearModalTab] = useState(0);
  const openArmory = () => {
    openWowArmory(player);
  };
  return (
    <>
      <div className="relative flex rounded-xl self-start border border-solid border-slate-600/40 min-h-[415px] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl hover:border-sky-500/30 transition-all duration-300">
        {/* Subtle glow effect */}
        <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-[#60A5FA10] via-transparent to-[#60A5FA10] pointer-events-none" />

        <PlayerImage
          player={player}
          onGearClick={() => {
            setGearModalTab(0);
            setGearModalOpen(true);
          }}
          onTalentsClick={() => {
            setGearModalTab(1);
            setGearModalOpen(true);
          }}
        />

        <PlayerName player={player} openArmory={openArmory} desktop />
        <PlayerImages player={player} desktop />

        <PlayerItemLvl player={player} desktop />
      </div>

      {/* Gear Modal */}
      <GearModal
        player={player}
        open={gearModalOpen}
        onClose={() => setGearModalOpen(false)}
        initialTab={gearModalTab}
      />
    </>
  );
};

export default PlayerCard;
