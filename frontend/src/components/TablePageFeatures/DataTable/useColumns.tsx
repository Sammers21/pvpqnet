import Typography from '@mui/material/Typography';

import {
  getClassNameColor,
  getRankDiffColor,
  getRealmColor,
  getDiffColor,
  getDiffCell,
  getImages,
  getWinRate,
  getWonAndLossColors,
  getRatingColor,
} from '../../../utils/activityTable';

import type { IActivityRecord } from '../../../types';
import { ACTIVITY } from '../../../constants';

const useColumns = (activity: string) => {
  const commonColumns = [
    {
      field: 'pos',
      label: 'RANK',
      render: ({ record }: { record: IActivityRecord }) => {
        const pos = record?.character?.pos || record?.pos;
        const rankDiff = record?.diff?.rank_diff;

        return (
          <div className="flex">
            <Typography className="font-light">{`#${pos}`}</Typography>

            {Number.isInteger(rankDiff) && (
              <Typography className="font-light ml-1" color={getRankDiffColor(rankDiff)}>
                {getDiffCell(rankDiff)}
              </Typography>
            )}
          </div>
        );
      },
    },
    {
      field: 'details',
      label: 'DETAILS',
      render: ({ record }: { record: IActivityRecord }) => {
        const wowClass = record?.character?.class || record?.class;
        const wowSpec = record?.character?.full_spec || record?.full_spec;
        const wowRace = record?.character?.race || record?.race;
        const wowGender = record?.character?.gender || record?.gender;

        const icons = getImages({ wowClass, wowSpec, wowRace, wowGender });

        return (
          <div className="flex">
            <img
              className="mr-1 h-5 w-5 rounded border border-solid border-[#37415180]"
              src={icons.raceIcon}
            />
            <img
              className="mr-1 h-5 w-5 rounded border border-solid border-[#37415180]"
              src={icons.classIcon}
            />
            <img
              className=" h-5 w-5 rounded border border-solid border-[#37415180]"
              src={icons.specIcon}
            />
          </div>
        );
      },
    },
    {
      field: 'name',
      label: 'NAME',
      render: ({ record }: { record: IActivityRecord }) => {
        const wowClass = record?.character?.class || record?.class;
        const name = record?.character?.name || record?.name;

        return <Typography color={getClassNameColor(wowClass)}>{name}</Typography>;
      },
    },
    {
      field: 'realm',
      label: 'REALM',
      render: ({ record }: { record: IActivityRecord }) => {
        const fraction = record?.character?.fraction || record?.fraction;
        const realm = record?.character?.realm || record?.realm;

        return <Typography color={getRealmColor(fraction)}>{realm}</Typography>;
      },
    },
    {
      field: 'stats',
      label: 'WON / LOST',
      render: ({ record }: { record: IActivityRecord }) => {
        const winRate = getWinRate(record.wins, record.losses);

        const won = record?.diff?.won ?? record?.wins;
        const loss = record?.diff?.lost ?? record?.losses;
        const { wonColor, lossColor } = getWonAndLossColors(won, loss);

        return (
          <div className="flex">
            <Typography className={`font-light mr-1 text-[${wonColor}]`}>{`${won} `}</Typography>
            <Typography className="font-light">{` / `}</Typography>
            <Typography className={`font-light ml-1 text-[${lossColor}]`}>{loss}</Typography>

            {winRate && (
              <Typography className="text-[#4B5563] mt-0.5 ml-2 mr-2 font-light text-sm">
                {winRate}
              </Typography>
            )}
          </div>
        );
      },
    },
    {
      field: 'rating',
      label: 'RATING',
      render: ({ record }: { record: IActivityRecord }) => {
        const rating = record?.character?.rating ?? record?.rating;
        const ratingColor = getRatingColor(record?.character?.in_cutoff ?? record?.in_cutoff);
        const ratingDiff = record?.diff?.rating_diff;

        return (
          <div className="flex">
            <Typography className={`font-light mr-1 text-[${ratingColor}]`}>{rating}</Typography>
            {Number.isInteger(ratingDiff) && (
              <Typography color={getDiffColor(ratingDiff)} className="ml-1 font-light">
                {getDiffCell(ratingDiff)}
              </Typography>
            )}
          </div>
        );
      },
    },
  ];

  const lastSeenColumn = {
    field: 'lastSeen',
    label: 'LAST SEEN',
    render: ({ record }: { record: IActivityRecord }) => {
      return <Typography>{record?.diff?.last_seen}</Typography>;
    },
  };

  return activity === ACTIVITY.activity ? [...commonColumns, lastSeenColumn] : commonColumns;
};

export default useColumns;
