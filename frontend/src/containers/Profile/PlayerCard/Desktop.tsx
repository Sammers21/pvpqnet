import { openWowArmory } from "@/utils/urlparts";
import { PlayerItemLvl, PlayerImages, PlayerName } from "./common";

import type { Player } from "@/types";
import { CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";

interface IProps {
  player: Player;
  openArmory?: () => void;
}

const PlayerImage = ({ player }: IProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!player.media.main_raw) return;
    const playerImage = new Image();
    playerImage.src = player.media.main_raw;
    playerImage.onload = () => {
      setIsLoaded(true);
    };
  },[player])
  if (!player.media.main_raw){
    return (
      <div>
        <div className="smoke-bg absolute left-0 top-0 w-[300px] h-full bg-cover bg-no-repeat rounded-xl opacity-50" />
        <div className="w-[300px] h-full flex justify-center items-center">
        </div>
      </div>
    )
  }
  return (
    <div>
      <div className="smoke-bg absolute left-0 top-0 w-[300px] h-full bg-cover bg-no-repeat rounded-xl opacity-50" />
      {player.media?.main_raw && isLoaded ? (
        <img
          className="-scale-x-100 w-full h-full object-cover select-none"
          alt="Player"
          src={player.media.main_raw}
        />
      ) : (
        <div className="w-[300px] h-full flex justify-center items-center">
          <CircularProgress></CircularProgress>
        </div>
      )}
    </div>
  );
};

const PlayerCard = ({ player }: IProps) => {
  const openArmory = () => {
    openWowArmory(player);
  };

  return (
    <div className="relative flex rounded-xl self-start border border-solid border-[#37415180] min-h-[415px]">
      <PlayerImage player={player} />

      <PlayerName player={player} openArmory={openArmory} desktop />
      <PlayerImages player={player} desktop />

      <PlayerItemLvl player={player} desktop />
    </div>
  );
};

export default PlayerCard;
