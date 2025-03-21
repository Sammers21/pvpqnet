import { openWowArmory } from "@/utils/urlparts";
import { PlayerItemLvl, PlayerImages, PlayerName } from "./common";

import type { Player } from "@/types";

interface IProps {
  player: Player;
  openArmory?: () => void;
}

const PlayerImage = ({ player }: IProps) => (
  <>
    <div className="smoke-bg absolute left-0 top-0 w-full h-full bg-cover bg-no-repeat rounded-xl opacity-50" />

    {player.media?.main_raw && (
      <img
        className="-scale-x-100 object-cover select-none"
        alt="Player"
        src={player.media.main_raw}
      />
    )}
  </>
);

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
