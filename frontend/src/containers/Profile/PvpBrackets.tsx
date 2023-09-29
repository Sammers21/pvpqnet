import { useMemo } from 'react';
import type { IPlayerBracket, IPlayer } from '../../types';
import { getSpecIcon, ratingToColor } from '../../utils/table';
import { CLASS_AND_SPECS } from '../../constants/filterSchema';

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
    <div
      style={{ minWidth: 185 }}
      className="relative flex grow flex-col items-center border border-solid rounded-lg border-[#37415180] px-3 py-2 bg-[#030303e6]"
    >
      <div className="absolute top-2 left-3">
        {specIcon ? (
          <img
            className="h-9 w-9 rounded border border-solid border-[#37415180]"
            src={specIcon}
            alt="spec icon"
          />
        ) : (
          <span className="text-xl">{title}</span>
        )}
      </div>

      <div className="flex justify-center">
        <span className="pb-1 text-4xl font-semibold" style={{ color: ratingColor }}>
          {bracket?.rating || 0}
        </span>

        {bracket?.rank && bracket.rank !== -1 && (
          <div className="flex ml-1 items-center justify-between">
            <span className="text-white">#{bracket.rank}</span>
          </div>
        )}
      </div>

      <div className="pt-1 flex flex-col w-full border-t border-solid border-[#60A5FA50]">
        <div className="pb-1 flex text-[#60A5FACC] text-sm">
          <div className="flex flex-col items-center grow border-r border-solid border-[#60A5FA50] px-1">
            <span>total</span>
            <span className="text-lg text-white">{(bracket?.lost || 0) + (bracket?.won || 0)}</span>
          </div>

          <div className="flex flex-col items-center grow px-1">
            <span>wins</span>
            <span className="text-lg" style={{ color: stats.wonColor }}>
              {bracket?.won || 0}
            </span>
          </div>

          {stats.showWinRate && (
            <div className="flex flex-col items-center grow px-1 border-l border-solid border-[#60A5FA50]">
              <span>winrate</span>
              <span style={{ color: stats.winRateColor }} className="text-lg">
                {stats.winRate}%
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 text-[#60A5FACC] pt-1 text-sm border-t border-solid border-[#60A5FA50]">
          {bracket?.season_max_rating && bracket.season_max_rating !== -1 && (
            <div className="py-1 gap-2 grow flex justify-center items-center border-r border-solid border-[#60A5FA50]">
              <span>Season</span>
              <span className="text-white">{bracket.season_max_rating}</span>
            </div>
          )}

          {bracket?.max_rating && bracket.max_rating !== -1 && (
            <div className="py-1 gap-2 grow flex justify-center items-center">
              <span>Record</span>
              <span className="text-white">{bracket.max_rating}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PvpBrackets = ({ player }: IProps) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[player.class] as string[];

  return (
    <div className="flex justify-start flex-col border border-solid rounded-lg border-[#37415180] px-3 py-4 bg-[#030303e6]">
      <div className="flex gap-4 justify-start">
        {arenaAndRbg.map(({ title, name }) => {
          const playerBracket = (player?.brackets || []).find((b) => b.bracket_type === name);
          return <PvpBracket key={name} title={title} bracket={playerBracket} />;
        })}
      </div>

      <div className="flex flex-wrap gap-4 justify-start mt-6">
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
