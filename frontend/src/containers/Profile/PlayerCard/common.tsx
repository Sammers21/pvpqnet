import { useMemo } from 'react';
import { Tooltip } from '@mui/material';
import {
  getClassNameColor,
  getFractionIcon,
  getDetaisImages,
  getRealmColor,
} from '../../../utils/table';

import wowIcon from '../../../assets/wow-icon.png';

import type { IPlayer } from '../../../types';

interface IProps {
  player: IPlayer;
  openArmory?: () => void;
  desktop?: boolean;
}

export const PlayerName = ({ player, desktop, openArmory }: IProps) => (
  <div className={`flex flex-col justify-start ${desktop && 'absolute left-0 top-0 mt-2 ml-3'}`}>
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
      className={`flex gap-1 items-end md:items-start justify-start ${
        desktop && 'absolute left-0 bottom-0 mb-3 ml-3'
      }`}
    >
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

export const PlayerItemLvl = ({ player, desktop }: IProps) => (
  <div className={`flex flex-col ${desktop && 'absolute right-0 top-0 mt-2 mr-3'}`}>
    <span className="text-[#60A5FACC] text-base">
      <span className="text-[#ffffff] text-lg font-bold mr-2">{player.itemLevel}</span>
      ILVL
    </span>
  </div>
);
