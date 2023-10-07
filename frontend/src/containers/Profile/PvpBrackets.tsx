import { useMemo } from 'react';
import dayjs from 'dayjs-ext';

import { Chip, LinearProgress, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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
    <div className="flex w-1/3 self-stretch flex-col items-center pr-2">
      <div className="relative flex flex-col w-full h-full rounded-lg border pb-4 px-3 border-solid border-[#37415180] bg-[#030303e6]">
        <div className="flex flex-col w-full justify-start py-2">
          <div className="flex w-full justify-between items-center">
            {specIcon ? (
              <img
                className="h-9 w-9 rounded border border-solid border-[#37415180]"
                src={specIcon}
                alt={title}
              />
            ) : (
              <span className="text-base sm:text-3xl text-white">{title}</span>
            )}

            <div className="hidden sm:flex sm:flex-col rounded-lg absolute top-0 right-0 px-2 pt-2 bg-[#030303e6]">
              {bracket?.season_max_rating &&
              bracket.season_max_rating !== -1 &&
              bracket?.season_max_rating !== bracket?.max_rating ? (
                <Tooltip
                  placement="right"
                  title={`Season record achieved at ${dayjs(
                    bracket.season_max_rating_achieved_timestamp
                  ).format('MM.DD.YY')}`}
                >
                  <div className="flex gap-2 flex-row justify-center items-center text-[#60A5FACC]">
                    <span className="text-base">Season</span>
                    <span className="text-white text-xs sm:text-base flex items-center">
                      {bracket.season_max_rating}
                      <InfoOutlinedIcon fontSize="small" className="!ml-1 !w-4 !h-4" />
                    </span>
                  </div>
                </Tooltip>
              ) : null}
              {bracket?.max_rating && bracket.max_rating !== -1 ? (
                <Tooltip
                  placement="right"
                  title={`Record achieved at ${dayjs(bracket.max_rating_achieved_timestamp).format(
                    'MM.DD.YY'
                  )}`}
                >
                  <div className="flex gap-2 flex-row justify-center items-center text-[#60A5FACC]">
                    <span className="text-base">Record</span>
                    <span className="text-white text-xs sm:text-base flex items-center">
                      {bracket.max_rating}
                      <InfoOutlinedIcon fontSize="small" className="!ml-1 !w-4 !h-4" />
                    </span>
                  </div>
                </Tooltip>
              ) : null}
            </div>
          </div>

          <div className="flex gap-2 mt-1 pt-1 border-t border-solid border-[#37415180]">
            <span
              className="flex flex-col md:flex-row items-center gap-2 text-3xl md:text-4xl font-semibold"
              style={{ color: ratingColor }}
            >
              {bracket?.rating || 0}
            </span>
            {bracket?.rank && bracket.rank !== -1 ? (
              <div className="hidden sm:flex items-center justify-between relative">
                <Chip className="!text-xs md:!text-sm" label={`#${bracket.rank}`} size="small" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="pb-1 gap-0 sm:gap-2 flex sm:flex-row flex-col text-[#60A5FACC] text-sm">
          <div className="flex text-sm md:text-base">
            <span className="text-[#008000]">{bracket?.won || 0}</span>
            <span className="text-[#374151E6] mx-[2px]">/</span>
            <span className="text-[#ff0000]">{bracket?.lost || 0}</span>
          </div>

          <div className="flex pl-0 sm:pl-2 sm:border-l border-solid border-[#37415180]">
            <span
              className="text-sm md:text-base text-[#4B5563]"
              style={{ opacity: stats.showWinRate ? 1 : 0 }}
            >
              {stats.showWinRate ? `${stats.winRate}%` : '-'}
            </span>
          </div>
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
    </div>
  );
};

const PvpBrackets = ({ player }: IProps) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[player.class] as string[];

  return (
    <div className="flex gap-2 justify-start flex-col">
      <div className="flex flex-nowrap flex-row items-stretch justify-start">
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
