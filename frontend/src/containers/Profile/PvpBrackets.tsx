import { useMemo } from 'react';
import { Chip, LinearProgress } from '@mui/material';

import { getSpecIcon, getWonAndLossColors, ratingToColor } from '../../utils/table';
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

    const { wonColor, lossColor } = getWonAndLossColors(won, lost);
    const showWinRate = won > 0 || lost > 0;
    const winRate = ((won * 100) / (won + lost)).toFixed(2);
    const winRateColor = parseInt(winRate, 10) >= 50 ? 'green' : '#ff0531';

    return { showWinRate, winRateColor, wonColor, lossColor, winRate };
  }, [bracket]);

  return (
    <div className="relative flex w-1/3 flex-col items-center px-1">
      <div className="flex flex-col w-full rounded-lg border pb-2 border-solid border-[#37415180] bg-[#030303e6]">
        <div className="relative flex flex-col w-full justify-start gap-0 px-3 py-2">
          <div className="flex w-full justify-between">
            {specIcon ? (
              <div className="flex items-center gap-2 my-2">
                <img
                  className="h-8 w-8 rounded border border-solid border-[#37415180]"
                  src={specIcon}
                  alt="spec icon"
                />
              </div>
            ) : (
              <span className="text-base md:text-2xl text-white">{title}</span>
            )}
            {bracket?.max_rating && bracket.max_rating !== -1 ? (
              <div className="flex gap-2 flex-row justify-center items-center text-[#60A5FACC] text-sm">
                <span className="text-sm">Highest</span>
                <span className="text-white text-xs md:text-lg">{bracket.max_rating}</span>
              </div>
            ) : null}
          </div>

          <div className="flex gap-2 mt-1 pt-1 border-t border-solid border-[#37415180]">
            <span
              className="flex flex-col md:flex-row items-center gap-0 md:gap-2 text-xl md:text-4xl font-semibold"
              style={{ color: ratingColor }}
            >
              {bracket?.rating || 0}
            </span>
            {bracket?.rank && bracket.rank !== -1 ? (
              <div className="flex items-center justify-between absolute top-1 right-0 md:relative">
                <Chip className="!text-[8px] md:!text-sm" label={`#${bracket.rank}`} size="small" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="pb-1 gap-2 flex md:flex-row flex-col text-[#60A5FACC] text-sm">
            <div className="flex">
              <span className="text-sm md:text-base text-white">
                {bracket?.won || 0}
                <span className="ml-[1px] text-[#008000]">W</span>
              </span>

              <span className="text-sm md:text-base text-white pl-2">
                {bracket?.lost || 0}
                <span className="ml-[1px] text-[#ff0000]">L</span>
              </span>
            </div>

            {stats.showWinRate && (
              <div className="flex pl-2 md:border-l border-solid border-[#37415180]">
                <span style={{ color: stats.winRateColor }} className="text-sm md:text-base">
                  {stats.winRate}%
                </span>
              </div>
            )}
          </div>
          <LinearProgress
            variant="determinate"
            value={parseInt(stats.winRate, 10)}
            sx={{
              '& .MuiLinearProgress-bar': { backgroundColor: '#008000' },
              '&.MuiLinearProgress-root': { backgroundColor: '#ff0000' },
            }}
          />
        </div>

        {/* <div className="flex w-full flex-col md:flex-row md:gap-1 text-[#60A5FACC] text-sm border-t border-solid border-[#37415180]">
          {bracket?.season_max_rating && bracket.season_max_rating !== -1 ? (
            <div className="px-1 md:py-1 w-1/2 flex flex-col justify-center items-center">
              <span className="text-xs">Season</span>
              <span className="text-white font-semibold text-xs md:text-xl">
                {bracket.season_max_rating}
              </span>
            </div>
          ) : null}

          {bracket?.max_rating && bracket.max_rating !== -1 ? (
            <div className="px-1 md:py-1 w-1/2 flex flex-col justify-center items-center">
              <span className="text-xs">Record</span>
              <span className="text-white font-semibold text-xs md:text-xl">
                {bracket.max_rating}
              </span>
            </div>
          ) : null}
        </div> */}
      </div>
    </div>
  );
};

const PvpBrackets = ({ player }: IProps) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[player.class] as string[];

  return (
    <div className="flex gap-2 justify-start flex-col">
      <div className="flex flex-nowrap justify-start">
        {arenaAndRbg.map(({ title, name }) => {
          const playerBracket = (player?.brackets || []).find((b) => b.bracket_type === name);
          return <PvpBracket key={name} title={title} bracket={playerBracket} />;
        })}
      </div>

      <div className="flex flex-wrap justify-start">
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
