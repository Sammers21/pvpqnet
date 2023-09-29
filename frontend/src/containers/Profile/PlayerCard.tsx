import { useMemo } from 'react';
import { Tooltip } from '@mui/material';
import type { IPlayer } from '../../types';
import { getClassNameColor, getFractionIcon, getImages, getRealmColor } from '../../utils/table';
import { EuIcon, UsIcon } from '../../components/icons';
import wowIcon from '../../assets/wow-icon.png';
import { REGIONS } from '../../constants/region';

interface IProps {
  player: IPlayer;
  openArmory?: () => void;
}

const PlayerNameAndFraction = ({ player, openArmory }: IProps) => (
  <div className="flex flex-col justify-start absolute left-0 top-0 pt-2 pl-3">
    <span
      className="text-xl font-semibold cursor-pointer"
      style={{ color: getClassNameColor(player?.class) }}
      onClick={openArmory}
    >
      {player?.name}
    </span>

    <div className="flex items-center">
      {player?.fraction && (
        <img className="w-4 h-6 mr-1" src={getFractionIcon(player.fraction)} alt="fraction" />
      )}
      <span className="text-sm" style={{ color: getRealmColor(player?.fraction) }}>
        {player?.realm}
      </span>
    </div>
  </div>
);

const PlayerIcons = ({ player }: IProps) => {
  const playerIcons = useMemo(
    () =>
      getImages({
        wowClass: player.class,
        wowSpec: `${player.activeSpec} ${player.class}`,
        wowRace: player.race,
        wowGender: player.gender,
      }),
    [player]
  );

  return (
    <div className="flex gap-1 justify-start absolute left-0 bottom-0 pb-2 pl-3">
      <img
        className="h-9 w-9 rounded border border-solid border-[#37415180]"
        src={playerIcons.raceIcon}
        alt="race icon"
      />
      <img
        className="h-9 w-9 rounded border border-solid border-[#37415180]"
        src={playerIcons.classIcon}
        alt="class icon"
      />
      <img
        className=" h-9 w-9 rounded border border-solid border-[#37415180]"
        src={playerIcons.specIcon}
        alt="spec icon"
      />
    </div>
  );
};

export const PlayerLinks = ({ player, openArmory }: IProps) => {
  const RegionIcon = player.region === REGIONS.eu ? EuIcon : UsIcon;

  return (
    <div className="flex gap-2 justify-start items-center absolute right-0 bottom-0 pb-2 pr-3">
      <RegionIcon />

      <Tooltip title="Open armory" placement="top">
        <img className="h-7 w-7 cursor-pointer" onClick={openArmory} src={wowIcon} alt="wow logo" />
      </Tooltip>
    </div>
  );
};

const PlayerImage = ({ player }: IProps) => (
  <>
    <div
      className="absolute left-0 top-0 w-full h-full bg-cover bg-no-repeat rounded-xl opacity-50"
      style={{
        backgroundImage: 'url(https://lostark.meta-game.gg/smoke-bg.jpg)',
        backgroundPosition: '50%',
      }}
    />
    <img
      className="object-cover"
      style={{ transform: 'scaleX(-1)' }}
      alt="Profile-pic"
      src={player?.media?.main_raw}
    />
  </>
);

export const PlayerItemLvl = ({ player }: IProps) => (
  <div className="flex flex-col items-center absolute right-0 top-0 pt-2 pr-3">
    <span className="text-[#60A5FACC] text-base">
      <span className="text-[#ffffff] text-lg font-bold mr-2">{player.itemLevel}</span>
      ILVL
    </span>
  </div>
);

const PlayerCard = ({ player }: IProps) => {
  const openArmory = () => {
    const url = `https://worldofwarcraft.blizzard.com/en-gb/character/${player.region}/${player.realm}/${player.name}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="relative flex rounded-xl self-start border border-solid border-[#37415180]"
      style={{ minHeight: 415, maxWidth: 300, minWidth: 275 }}
    >
      <PlayerImage player={player} />
      <PlayerNameAndFraction player={player} openArmory={openArmory} />
      <PlayerIcons player={player} />

      <PlayerItemLvl player={player} />
    </div>
  );
};

export default PlayerCard;
