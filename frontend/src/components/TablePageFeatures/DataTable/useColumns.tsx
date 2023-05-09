import { Box, Typography } from '@mui/material';
import { FRACTION, WOW_CLASS } from '../../../constants';

const TABLE_FIELDS = {
  rank: 'pos',
  details: 'details',
  name: 'name',
  realm: 'realm',
  stats: 'stats',
  rating: 'rating',
  lastSeen: 'lastSeen',
};

const getRealmColor = (fraction: FRACTION) => {
  return fraction === FRACTION.ALLIANCE ? '#3FC7EB' : '#ff0000';
};

const specNameFromFullSpec = (wowSpec: string) => {
  return wowSpec.trim().replaceAll(' ', '').toLowerCase();
};

const getDetails = (wowClass: WOW_CLASS, wowSpec: string, wowRace: string, wowGender: string) => {
  const classSrc = require('../../assets/classicons/' +
    wowClass.replaceAll(' ', '').toLowerCase() +
    '.png');
  let specSrc;
  let specIcon = specNameFromFullSpec(wowSpec) + '.png';
  try {
    specSrc = require('../../assets/specicons/' + specIcon);
  } catch (e) {
    console.log(`SpecIcon: ${specIcon} was not found`);
    specSrc = require('../../assets/unknown.png');
  }
  let raceSrc;
  let raceIcon =
    wowGender.toLowerCase().charAt(0) +
    wowRace.replaceAll(' ', '').replaceAll("'", '').toLowerCase() +
    '.webp';
  try {
    raceSrc = require('../../assets/raceicons/' + raceIcon);
  } catch (e) {
    console.log(`RaceIcon: ${raceIcon} was not found`);
    raceSrc = require('../../assets/unknown.png');
  }
  return { classSrc, specSrc, raceSrc };
};

const getClassNameColor = (wowClass: string) => {
  wowClass = wowClass.toUpperCase();

  if (wowClass === WOW_CLASS.WARRIOR) {
    return '#C69B6D';
  } else if (wowClass === WOW_CLASS.PALADIN) {
    return '#F48CBA';
  } else if (wowClass === WOW_CLASS.HUNTER) {
    return '#8EBA43';
  } else if (wowClass === WOW_CLASS.ROGUE) {
    return '#FFF468';
  } else if (wowClass === WOW_CLASS.PRIEST) {
    return '#FFFFFF';
  } else if (wowClass === WOW_CLASS['DEATH KNIGHT']) {
    return '#C41E3A';
  } else if (wowClass === WOW_CLASS.SHAMAN) {
    return '#0070DD';
  } else if (wowClass === WOW_CLASS.MAGE) {
    return '#3FC7EB';
  } else if (wowClass === WOW_CLASS.WARLOCK) {
    return '#8788EE';
  } else if (wowClass === WOW_CLASS.MONK) {
    return '#00FF98';
  } else if (wowClass === WOW_CLASS.DRUID) {
    return '#FF7C0A';
  } else if (wowClass === WOW_CLASS['DEMON HUNTER']) {
    return '#A330C9';
  } else if (wowClass === WOW_CLASS.EVOKER) {
    return '#33937F';
  } else {
    return '#FFFFFF';
  }
};

const getDiffColor = (diff: number): string => {
  if (diff === 0) return 'white';
  return diff > 0 ? 'green' : '#ff0000';
};

const getRankDiffColor = (diff: number): string => {
  if (diff === 0) return 'white';
  return diff < 0 ? 'green' : '#ff0000';
};

const getDiffCell = (diff: number): string | number => {
  return diff >= 0 ? `+${diff}` : diff;
};

const useColumns = () => {
  return [
    {
      field: TABLE_FIELDS.rank,
      label: 'RANK',
      render: ({ record }: { record: any }) => {
        const pos = record?.character?.pos || record?.pos;

        return (
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ fontWeight: 300 }}>{`#${pos}`}</Typography>
            {Number.isInteger(record?.diff?.rank_diff) && (
              <Typography
                color={getRankDiffColor(record.diff.rank_diff)}
                sx={{ marginLeft: '4px', fontWeight: 300 }}
              >
                {getDiffCell(record.diff.rank_diff)}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: TABLE_FIELDS.details,
      label: 'DETAILS',
      render: ({ record }: { record: any }) => {
        const wowClass = record?.character?.class || record?.class;
        const wowSpec = record?.character?.full_spec || record?.full_spec;
        const wowRace = record?.character?.race || record?.race;
        const wowGender = record?.character?.gender || record?.gender;
        const details = getDetails(wowClass, wowSpec, wowRace, wowGender);
        return (
          <Box sx={{ display: 'flex' }}>
            <img
              style={{
                border: '1px #37415180 solid',
                borderRadius: '4px',
                marginLeft: '5px',
                height: '20px',
                width: '20px',
              }}
              src={details.raceSrc}
            />
            <img
              style={{
                border: '1px #37415180 solid',
                borderRadius: '4px',
                height: '20px',
                width: '20px',
              }}
              src={details.classSrc}
            />
            <img
              style={{
                border: '1px #37415180 solid',
                borderRadius: '4px',
                marginLeft: '5px',
                height: '20px',
                width: '20px',
              }}
              src={details.specSrc}
            />
          </Box>
        );
      },
    },
    {
      field: TABLE_FIELDS.name,
      label: 'NAME',
      render: ({ record }: { record: any }) => {
        const wowClass = record?.character?.class || record?.class;
        const name = record?.character?.name || record?.name;
        return <Typography color={getClassNameColor(wowClass)}>{name}</Typography>;
      },
    },
    {
      field: TABLE_FIELDS.realm,
      label: 'REALM',
      render: ({ record }: { record: any }) => {
        const fraction = record?.character?.fraction || record?.fraction;
        const realm = record?.character?.realm || record?.realm;
        return <Typography color={getRealmColor(fraction)}>{realm}</Typography>;
      },
    },
    {
      field: TABLE_FIELDS.stats,
      label: 'WON / LOST',
      render: ({ record }: { record: any }) => {
        const winRate =
          record?.wins && ((record.wins * 100) / (record.wins + record.losses)).toFixed(2) + `%`;
        const won = record?.diff?.won ?? record?.wins;
        const loss = record?.diff?.lost ?? record?.losses;
        const wonColor = won > 0 ? 'green' : 'white';
        const lostColor = loss > 0 ? '#ff0000' : 'white';
        return (
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ fontWeight: 300, marginRight: '4px' }} color={wonColor}>
              {`${won} `}
            </Typography>
            <Typography sx={{ fontWeight: 300 }}>{` / `}</Typography>
            <Typography color={lostColor} sx={{ marginLeft: '4px', fontWeight: 300 }}>
              {loss}
            </Typography>
            {winRate && (
              <Typography
                color="rgb(75, 85, 99)"
                sx={{
                  marginLeft: '6px',
                  marginTop: '2px',
                  fontWeight: 300,
                  fontSize: 14,
                  marginRight: '4px',
                }}
              >
                {winRate}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: TABLE_FIELDS.rating,
      label: 'RATING',
      render: ({ record }: { record: any }) => {
        const rating = record?.character?.rating ?? record?.rating;
        const ratingColor = record?.character?.in_cutoff ?? record?.in_cutoff ? '#fb7e00' : 'white';
        return (
          <Box sx={{ display: 'flex' }}>
            <Typography color={ratingColor} sx={{ fontWeight: 300, marginRight: '4px' }}>
              {rating}
            </Typography>
            {Number.isInteger(record?.diff?.rating_diff) && (
              <Typography
                color={getDiffColor(record.diff.rating_diff)}
                sx={{ marginLeft: '4px', fontWeight: 300 }}
              >
                {getDiffCell(record.diff.rating_diff)}
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: TABLE_FIELDS.lastSeen,
      label: 'LAST SEEN',
      render: ({ record }: { record: any }) => {
        return <Typography>{record?.diff?.last_seen}</Typography>;
      },
    },
  ];
};

export default useColumns;
