import moment from 'moment-timezone';

import CharacterChip from './CharacterChip';
import { getDiffCell, getRankDiffColor, getWonAndLossColors, getDiffColor } from '@/utils/table';

import type { IHistoryRow, IPlayer, ITableColumn } from '@/types';

interface IParams {
  record: IHistoryRow;
}

const renderRank = ({ record }: IParams) => {
  const position = record.RANK.character?.pos ?? record.RANK.rank;
  const rankDiff = record.RANK.diff.rank_diff;

  return (
    <div className="flex">
      <span className="text-base font-light">{`#${position}`}</span>
      {Number.isInteger(rankDiff) && (
        <span className="text-base font-light ml-1" style={{ color: getRankDiffColor(rankDiff) }}>
          {getDiffCell(rankDiff)}
        </span>
      )}
    </div>
  );
};

const renderWinAndLoss = ({ record }: IParams) => {
  const won = record.WL.won;
  const loss = record.WL.lost;
  const { wonColor, lossColor } = getWonAndLossColors(won, loss);

  return (
    <div className="flex">
      <span className="text-base font-light mr-1" style={{ color: wonColor }}>{`${won} `}</span>
      <span className="text-base font-light">{` / `}</span>
      <span className="text-base font-light ml-1" style={{ color: lossColor }}>
        {loss}
      </span>
    </div>
  );
};

const renderRating = ({ record }: IParams) => {
  const rating = record.RATING.character?.rating ?? record.RATING.rating;
  const ratingDiff = record.RATING.diff.rating_diff;

  return (
    <div className="flex">
      <span className="text-base font-light mr-2">{rating}</span>
      {Number.isInteger(ratingDiff) && (
        <span className="text-base font-light" style={{ color: getDiffColor(ratingDiff) }}>
          {getDiffCell(ratingDiff)}
        </span>
      )}
    </div>
  );
};

const renderWWho = ({ record }: IParams, player: IPlayer) => {
  return (
    <div className="flex md:gap-2">
      {record.WWHO.map((who) => (
        <CharacterChip char={who} region={player.region} show_nick />
      ))}
    </div>
  );
};

const renderServerTime = ({ record }: IParams, player: IPlayer) => {
  const getDate = (ts: number) => {
    const tz = player.region === 'eu' ? 'Europe/Paris' : 'America/Chicago';

    return moment
      .unix(ts / 1000)
      .utc()
      .tz(tz)
      .format('MMM DD, YYYY - hh:mm A');
  };

  return <span>{getDate(record.timestamp)}</span>;
};

const shouldRenderWWho = (bracket: string) => {
  return ['all', 'ARENA_2v2', 'ARENA_3v3'].includes(bracket);
};

export const tableColumns = (player: IPlayer, bracket: string): ITableColumn[] => [
  {
    field: 'rank',
    label: 'Rank',
    sortable: false,
    render: (params: IParams) => renderRank(params),
  },
  {
    field: 'wl',
    label: 'W / L',
    sortable: false,
    render: (params: IParams) => renderWinAndLoss(params),
  },
  {
    field: 'rating',
    label: 'Rating',
    sortable: false,
    render: (params: IParams) => renderRating(params),
  },
  ...(shouldRenderWWho(bracket)
    ? [
        {
          field: 'wwho',
          label: 'WWHO',
          sortable: false,
          render: (params: IParams) => renderWWho(params, player),
        },
      ]
    : []),
  {
    field: 'timestamp',
    label: `Server Time ${player.region.toUpperCase()}`,
    render: (params: IParams) => renderServerTime(params, player),
  },
];
