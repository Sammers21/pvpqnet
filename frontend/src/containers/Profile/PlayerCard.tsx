import { useMemo } from 'react';
import { Tooltip } from '@mui/material';
import type { IPlayer } from '../../types';
import {
  getClassNameColor,
  getFractionIcon,
  getDetaisImages,
  getRealmColor,
} from '../../utils/table';

import smokeBg from '../../assets/smoke-bg.jpg';
import wowIcon from '../../assets/wow-icon.png';

interface IProps {
  player: IPlayer;
  openArmory?: () => void;
}

const PlayerName = ({ player, openArmory }: IProps) => (
  <div className="flex flex-col justify-start absolute left-0 top-0 mt-2 ml-3">
    <Tooltip title="Open WoW Armory" placement="top">
      <span
        className="flex items-center gap-2 text-xl font-semibold cursor-pointer"
        style={{ color: getClassNameColor(player.class) }}
        onClick={openArmory}
      >
        {player.name} <img className="w-5 h-5" src={wowIcon} alt="Wow icon" />
      </span>
    </Tooltip>

    <div className="flex gap-1 items-center">
      {player.fraction && (
        <img className="w-5" src={getFractionIcon(player.fraction)} alt="fraction" />
      )}
      <span className="text-sm" style={{ color: getRealmColor(player.fraction) }}>
        {player.realm}
      </span>
    </div>
  </div>
);

const PlayerImages = ({ player }: IProps) => {
  const playerImages = useMemo(() => {
    return getDetaisImages({
      wowClass: player.class,
      wowSpec: `${player.activeSpec} ${player.class}`,
      wowRace: player.race,
      wowGender: player.gender,
    });
  }, [player]);

  return (
    <div className="flex gap-1 justify-start absolute left-0 bottom-0 mb-3 ml-3">
      <img
        className="h-9 w-9 rounded border border-solid border-[#37415180]"
        src={playerImages.raceIcon}
        alt={player.race}
      />
      <img
        className="h-9 w-9 rounded border border-solid border-[#37415180]"
        src={playerImages.classIcon}
        alt={player.class}
      />
      <img
        className=" h-9 w-9 rounded border border-solid border-[#37415180]"
        src={playerImages.specIcon}
        alt={`${player.activeSpec} ${player.class}`}
      />
    </div>
  );
};

const PlayerItemLvl = ({ player }: IProps) => (
  <div className="flex flex-col items-center absolute right-0 top-0 mt-2 mr-3">
    <span className="text-[#60A5FACC] text-base">
      <span className="text-[#ffffff] text-lg font-bold mr-2">{player.itemLevel}</span>
      ILVL
    </span>
  </div>
);

const PlayerImage = ({ player }: IProps) => (
  <>
    <div
      className="absolute left-0 top-0 w-full h-full bg-cover bg-no-repeat rounded-xl opacity-50"
      style={{ backgroundImage: `url(${smokeBg})`, backgroundPosition: '50%' }}
    />

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
    const url = `https://worldofwarcraft.blizzard.com/en-gb/character/${player.region}/${player.realm}/${player.name}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="relative flex rounded-xl self-start border border-solid border-[#37415180]"
      style={{ minHeight: 415 }}
    >
      <PlayerImage player={player} />

      <PlayerName player={player} openArmory={openArmory} />
      <PlayerImages player={player} />

      <PlayerItemLvl player={player} />
    </div>
  );
};

export default PlayerCard;
