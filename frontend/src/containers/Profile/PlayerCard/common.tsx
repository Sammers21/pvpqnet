import { useMemo } from "react";
import { Tooltip } from "@mui/material";
import {
  getClassNameColor,
  getFractionIcon,
  getDetaisImages,
  getRealmColor,
} from "@/utils/table";

import wowIcon from "@/assets/wow-icon.png";

import type { Player } from "@/types";

interface IProps {
  player: Player;
  openArmory?: () => void;
  desktop?: boolean;
}

export const PlayerName = ({ player, desktop, openArmory }: IProps) => (
  <div
    className={`flex flex-col justify-start ${
      desktop && "absolute left-0 top-0 mt-3 ml-4"
    }`}
  >
    <Tooltip title="Open WoW Armory" placement="top">
      <span
        className="flex items-center gap-2 text-xl font-bold cursor-pointer hover:brightness-125 transition-all duration-200 drop-shadow-lg"
        style={{
          color: getClassNameColor(player.class),
          textShadow: "0 2px 8px rgba(0,0,0,0.8)",
        }}
        onClick={openArmory}
      >
        {player.name}
        <img
          className="w-5 h-5 opacity-80 hover:opacity-100 transition-opacity"
          src={wowIcon}
          alt="Wow icon"
        />
      </span>
    </Tooltip>

    <div className="flex gap-1.5 items-center mt-0.5">
      {player.fraction && (
        <img
          className="w-5 drop-shadow-md"
          src={getFractionIcon(player.fraction)}
          alt="fraction"
        />
      )}
      <span
        className="text-sm font-medium drop-shadow-md"
        style={{ color: getRealmColor(player.fraction) }}
      >
        {player.realm}
      </span>
    </div>
  </div>
);

export const PlayerImages = ({ player, desktop }: IProps) => {
  const playerImages = useMemo(() => {
    return getDetaisImages({
      wowClass: player.class,
      wowSpec: `${player.activeSpec} ${player.class}`,
      wowRace: player.race,
      wowGender: player.gender,
    });
  }, [player]);

  return (
    <div
      className={`flex gap-1.5 items-end md:items-start justify-start ${
        desktop && "absolute left-0 bottom-0 mb-4 ml-4"
      }`}
    >
      <img
        className="h-10 w-10 rounded-lg border-2 border-solid border-slate-600/50 shadow-lg hover:border-sky-500/50 transition-all duration-200"
        src={playerImages.raceIcon}
        alt={player.race}
      />
      <img
        className="h-10 w-10 rounded-lg border-2 border-solid border-slate-600/50 shadow-lg hover:border-sky-500/50 transition-all duration-200"
        src={playerImages.classIcon}
        alt={player.class}
      />
      <img
        className="h-10 w-10 rounded-lg border-2 border-solid border-slate-600/50 shadow-lg hover:border-sky-500/50 transition-all duration-200"
        src={playerImages.specIcon}
        alt={`${player.activeSpec} ${player.class}`}
      />
    </div>
  );
};

export const PlayerItemLvl = ({ player, desktop }: IProps) => (
  <div
    className={`flex flex-col ${desktop && "absolute right-0 top-0 mt-3 mr-4"}`}
  >
    <div className="flex items-baseline gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 backdrop-blur-sm border border-slate-600/40 shadow-lg">
      <span className="text-xl font-bold text-white drop-shadow-md">
        {player.itemLevel}
      </span>
      <span className="text-xs font-medium text-[#60A5FACC] uppercase tracking-wider">
        ilvl
      </span>
    </div>
  </div>
);
