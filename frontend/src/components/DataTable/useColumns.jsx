import React from 'react';

import {Box, Link, Typography} from '@mui/material';
import {baseUrl} from "../../config";
import {winRateGreyColor} from "../../theme";

const TABLE_FIELDS = {
  rank: 'pos',
  details: 'details',
  name: 'name',
  realm: 'realm',
  stats: 'stats',
  rating: 'rating',
  lastSeen: 'lastSeen',
};

export const getRealmColor = (fraction) => {
  if (fraction === undefined) {
    return '#FFFFFF'
  }
  return fraction.toUpperCase() === 'ALLIANCE' ? '#3FC7EB' : '#ff0000';
};

export const specNameFromFullSpec = (wowSpec) => {
  return wowSpec.trim().replaceAll(' ', '').toLowerCase();
};

export const classIcon = (wowClass) => {
  return require('../../assets/classicons/' + wowClass.replaceAll(' ', '').toLowerCase() + '.png');
}

const getDetails = (wowClass, wowSpec, wowRace, wowGender) => {
  const classSrc = classIcon(wowClass);
  let specSrc;
  let specIcon = specNameFromFullSpec(wowSpec) + '.png';
  try {
    specSrc = require('../../assets/specicons/' + specIcon);
  } catch (e) {
    console.log(`SpecIcon: ${specIcon} was not found`)
    specSrc = require('../../assets/unknown.png');
  }
  let raceSrc;
  let raceIcon = wowGender.toLowerCase().charAt(0) + wowRace.replaceAll(' ', '').replaceAll("'", '').toLowerCase() + '.webp';
  try {
    raceSrc = require('../../assets/raceicons/' + raceIcon);
  } catch (e) {
    console.log(`RaceIcon: ${raceIcon} was not found`)
    raceSrc = require('../../assets/unknown.png');
  }
  return {classSrc, specSrc, raceSrc};
};

export const getClassNameColor = (wowClass) => {
  wowClass = wowClass.toUpperCase();
  if (wowClass === 'WARRIOR' || wowClass.includes('WARRIOR')) {
    return '#C69B6D';
  } else if (wowClass === 'DEMON HUNTER' || wowClass.includes('DEMON HUNTER')) {
    return '#A330C9';
  } else if (wowClass === 'PALADIN' || wowClass.includes('PALADIN')) {
    return '#F48CBA';
  } else if (wowClass === 'HUNTER' || wowClass.includes('HUNTER')) {
    return '#8EBA43';
  } else if (wowClass === 'ROGUE' || wowClass.includes('ROGUE')) {
    return '#FFF468';
  } else if (wowClass === 'PRIEST' || wowClass.includes('PRIEST')) {
    return '#FFFFFF';
  } else if (wowClass === 'DEATH KNIGHT' || wowClass.includes('DEATH KNIGHT')) {
    return '#C41E3A';
  } else if (wowClass === 'SHAMAN' || wowClass.includes('SHAMAN')) {
    return '#0070DD';
  } else if (wowClass === 'MAGE' || wowClass.includes('MAGE')) {
    return '#3FC7EB';
  } else if (wowClass === 'WARLOCK' || wowClass.includes('WARLOCK')) {
    return '#8788EE';
  } else if (wowClass === 'MONK' || wowClass.includes('MONK')) {
    return '#00FF98';
  } else if (wowClass === 'DRUID' || wowClass.includes('DRUID')) {
    return '#FF7C0A';
  } else if (wowClass === 'EVOKER' || wowClass.includes('EVOKER')) {
    return '#33937F';
  } else {
    return '#FFFFFF';
  }
};

const getDiffColor = (diff) => {
  if (diff === 0) return 'white';
  return diff > 0 ? 'green' : '#ff0000';
};

const getRankDiffColor = (diff) => {
  if (diff === 0) return 'white';
  return diff < 0 ? 'green' : '#ff0000';
};

const getDiffCell = (diff) => {
  return diff >= 0 ? `+${diff}` : diff;
};

const profileUrl = (record) => {
  const name = record?.character?.name || record?.name;
  const realm = record?.character?.realm || record?.realm;
  const region = (record?.character?.region || record?.region) ?? "eu";
  return window.location.origin + `/${region}/${realm}/${name}`;
}

const useColumns = (includeLastSeen) => {
  let res = [
    {
      field: TABLE_FIELDS.rank,
      label: 'RANK',
      render: ({ record }) => {
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
      render: ({ record }) => {
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
      render: ({ record }) => {
        const wowClass = record?.character?.class || record?.class;
        const name = record?.character?.name || record?.name;
        const url = profileUrl(record);
        return <Typography color={getClassNameColor(wowClass)}>
          <Link sx={{textDecoration: "none", boxShadow: "none"}}  href={url} color={getClassNameColor(wowClass)}>{name}</Link>
        </Typography>;
      },
    },
    {
      field: TABLE_FIELDS.realm,
      label: 'REALM',
      render: ({ record }) => {
        const fraction = record?.character?.fraction || record?.fraction;
        const realm = record?.character?.realm || record?.realm;
        return <Typography color={getRealmColor(fraction)}>{realm}</Typography>;
      },
    },
    {
      field: TABLE_FIELDS.stats,
      label: 'WON / LOST',
      render: ({ record }) => {
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
                color={winRateGreyColor}
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
      render: ({ record }) => {
        const rating = record?.character?.rating ?? record?.rating;
        const ratingColor = record?.character?.in_cutoff ?? record?.in_cutoff ? '#fb7e00' : 'white';
        return (
          <Box sx={{ display: 'flex' }}>
            <Typography color={ratingColor} sx={{ fontWeight: 300, marginRight: '4px' }}>{rating}</Typography>
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
    }
  ];
  if(includeLastSeen) {
    res.push({
      field: TABLE_FIELDS.lastSeen,
      label: 'LAST SEEN',
      render: ({ record }) => {
        return <Typography>{record?.diff?.last_seen}</Typography>;
      },
    });
  }
  return res;
};

export default useColumns;
