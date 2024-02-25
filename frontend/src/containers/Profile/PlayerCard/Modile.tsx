import { openWowArmory } from "@/utils/urlparts";
import { PlayerItemLvl, PlayerImages, PlayerName } from "./common";
import type { IPlayer } from "@/types";

interface IProps {
  player: IPlayer;
  openArmory?: () => void;
}

const PlayerCard = ({ player }: IProps) => {
  const openArmory = () => {
    openWowArmory(player);
  };

  return (
    <div className="flex rounded-lg gap-2 border border-solid border-[#37415180] px-2 py-2 bg-[#030303e6]">
      {player.media?.avatar && (
        <img
          className="object-cover select-none h-[80px] rounded-lg border border-solid border-[#60A5FA50]"
          alt="Player"
          src={player.media.avatar}
        />
      )}
      <div className="flex grow justify-between">
        <div className="flex flex-col justify-between">
          <PlayerName player={player} openArmory={openArmory} />
          <PlayerItemLvl player={player} />
        </div>

        <PlayerImages player={player} />
      </div>
    </div>
  );
};

export default PlayerCard;
