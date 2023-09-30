import { useMemo } from 'react';
import { Chip } from '@mui/material';

import { getSpecIcon, ratingToColor } from '../../utils/table';
import { CLASS_AND_SPECS } from '../../constants/filterSchema';
import type { IPlayerBracket, IPlayer } from '../../types';

interface IProps {
  player: IPlayer;
}

const arenaAndRbg = [
  { name: 'ARENA_2v2', title: '2v2' },
  { name: 'ARENA_3v3', title: '3v3' },
  { name: 'BATTLEGROUNDS', title: 'RBG' },
];

const PvpBracket = ({
  title,
  bracket,
  isShuffle,
  playerClass,
}: {
  title?: string;
  bracket?: IPlayerBracket;
  isShuffle?: boolean;
  playerClass?: string;
}) => {
  const specIcon = useMemo(() => {
    if (!isShuffle || !title) return;

    return getSpecIcon(`${title} ${playerClass}` || '');
  }, [title, isShuffle, playerClass]);

  const ratingColor = useMemo(() => {
    if (!bracket) return '#ffffff';
    return ratingToColor(bracket);
  }, [bracket]);

  const stats = useMemo(() => {
    const won = bracket?.won || 0;
    const lost = bracket?.lost || 0;

    const wonColor = won > 0 ? 'green' : '#ffffff';
    const showWinRate = won > 0 || lost > 0;
    const winRate = ((won * 100) / (won + lost)).toFixed(2);
    const winRateColor = parseInt(winRate, 10) >= 50 ? 'green' : '#ff0531';

    return { showWinRate, winRateColor, wonColor, winRate };
  }, [bracket]);

  return (
    <div className="relative flex grow flex-col items-center border border-solid rounded-lg border-[#37415180] px-1 md:px-3 py-2 bg-[#030303e6]">
      <div className="flex justify-center items-center mx-2">
        <span
          className="flex flex-col md:flex-row items-center gap-0 md:gap-2 pb-1 text-xl md:text-4xl font-semibold"
          style={{ color: ratingColor }}
        >
          {specIcon ? (
            <img
              className="h-8 w-8 rounded border border-solid border-[#37415180]"
              src={specIcon}
              alt="spec icon"
            />
          ) : (
            <span className="text-base md:text-2xl text-white md:mt-1">{title}</span>
          )}

          <div className="flex gap-1 md:gap-2">
            {bracket?.rating || 0}

            {bracket?.rank && bracket.rank !== -1 ? (
              <div className="flex items-center justify-between absolute top-1 right-0 md:relative">
                <Chip className="!text-[8px] md:!text-sm" label={`#${bracket.rank}`} size="small" />
              </div>
            ) : null}
          </div>
        </span>
      </div>

      <div className="pt-1 flex flex-col w-full border-t border-solid border-[#60A5FA50]">
        <div className="pb-1 flex md:flex-row flex-col text-[#60A5FACC] text-sm">
          <div className="flex grow">
            <div className="flex flex-col items-center grow border-r border-solid border-[#60A5FA50] px-1">
              <span className="md:flex hidden">total</span>
              <span className="text-sm md:text-base text-white">
                {(bracket?.lost || 0) + (bracket?.won || 0)}
              </span>
            </div>

            <div className="flex flex-col items-center grow px-1">
              <span className="md:flex hidden">wins</span>
              <span className="text-sm md:text-base" style={{ color: stats.wonColor }}>
                {bracket?.won || 0}
              </span>
            </div>
          </div>

          {stats.showWinRate && (
            <div className="flex flex-col items-center grow px-1 md:border-l border-solid border-[#60A5FA50]">
              <span className="md:flex hidden">winrate</span>
              <span style={{ color: stats.winRateColor }} className="text-sm md:text-base">
                {stats.winRate}%
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:gap-4 text-[#60A5FACC] md:pt-1 text-sm border-t border-solid border-[#60A5FA50]">
          {bracket?.season_max_rating && bracket.season_max_rating !== -1 ? (
            <div className="px-1 md:py-1 gap-1 grow flex justify-center items-center border-t md:border-t-0 md:border-r border-solid border-[#60A5FA50]">
              <span>Season</span>
              <span className="text-white text-xs md:text-base">{bracket.season_max_rating}</span>
            </div>
          ) : null}

          {bracket?.max_rating && bracket.max_rating !== -1 ? (
            <div className="px-1 md:py-1 gap-1 grow flex justify-center items-center">
              <span>Record</span>
              <span className="text-white text-xs md:text-base">{bracket.max_rating}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const PvpBrackets = ({ player }: IProps) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[player.class] as string[];

  return (
    <div className="flex gap-2 justify-start flex-col">
      <div className="flex flex-nowrap gap-2 justify-start">
        {arenaAndRbg.map(({ title, name }) => {
          const playerBracket = (player?.brackets || []).find((b) => b.bracket_type === name);
          return <PvpBracket key={name} title={title} bracket={playerBracket} />;
        })}
      </div>

      <div className="flex flex-wrap gap-2 justify-start">
        {classAndSpec.map((spec) => {
          const playerBracket = (player?.brackets || []).find((b) => b.bracket_type.includes(spec));
          return (
            <PvpBracket
              key={spec}
              bracket={playerBracket}
              title={spec}
              isShuffle
              playerClass={player.class}
            />
          );
        })}
      </div>
    </div>
  );
};

export default PvpBrackets;
