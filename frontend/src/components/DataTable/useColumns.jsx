import React from 'react';

import { Typography, Box } from '@mui/material';

const TABLE_FIELDS = {
  rank: 'pos',
  details: 'details',
  name: 'name',
  realm: 'realm',
  stats: 'stats',
  rating: 'rating',
  lastSeen: 'lastSeen',
};

function getClassNameColor(wowClass) {
  wowClass = wowClass.toUpperCase();

  if (wowClass === 'WARRIOR') {
    return '#C69B6D';
  } else if (wowClass === 'PALADIN') {
    return '#F48CBA';
  } else if (wowClass === 'HUNTER') {
    return '#8EBA43';
  } else if (wowClass === 'ROGUE') {
    return '#FFF468';
  } else if (wowClass === 'PRIEST') {
    return '#FFFFFF';
  } else if (wowClass === 'DEATH KNIGHT') {
    return '#C41E3A';
  } else if (wowClass === 'SHAMAN') {
    return '#0070DD';
  } else if (wowClass === 'MAGE') {
    return '#3FC7EB';
  } else if (wowClass === 'WARLOCK') {
    return '#8788EE';
  } else if (wowClass === 'MONK') {
    return '#00FF98';
  } else if (wowClass === 'DRUID') {
    return '#FF7C0A';
  } else if (wowClass === 'DEMON HUNTER') {
    return '#A330C9';
  } else if (wowClass === 'EVOKER') {
    return '#33937F';
  } else {
    return '#FFFFFF';
  }
}

const getDiffColor = (diff) => {
  if (diff === 0) return 'white';
  return diff > 0 ? 'green' : '#ff0000';
};

const getDiffCell = (diff) => {
  return diff > 0 ? `+${diff}` : diff;
};

const useColumns = () => {
  return [
    {
      field: TABLE_FIELDS.rank,
      label: 'RANK',
      render: ({ record }) => {
        const color = getDiffColor(record.diff.rank_diff);
        return (
          <Box sx={{ display: 'flex' }}>
            <Typography sx={{ fontWeight: 300 }}>{`#${record.character.pos}`}</Typography>
            <Typography color={color} sx={{ marginLeft: '4px', fontWeight: 300 }}>
              {getDiffCell(record.diff.rank_diff)}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: TABLE_FIELDS.details,
      label: 'DETAILS',
      render: ({ record }) => {
        return <Typography>{`#${record.character.pos}`}</Typography>;
      },
      flex: 1,
    },
    {
      field: TABLE_FIELDS.name,
      label: 'NAME',
      render: ({ record }) => {
        return (
          <Typography color={getClassNameColor(record.character.class)}>
            {record.character.name}
          </Typography>
        );
      },
    },
    {
      field: TABLE_FIELDS.realm,
      label: 'REALM',
      render: ({ record }) => {
        return <Typography>{record.character.pos}</Typography>;
      },
    },
    {
      field: TABLE_FIELDS.stats,
      label: 'WIN / LOST',
      render: ({ record }) => {
        return <Typography>{record.character.pos}</Typography>;
      },
    },
    {
      field: TABLE_FIELDS.rating,
      label: 'RATING',
      render: ({ record }) => {
        return <Typography>{record.character.pos}</Typography>;
      },
    },
    {
      field: TABLE_FIELDS.lastSeen,
      label: 'LAST SEEN',
      render: ({ record }) => {
        return <Typography>{record.character.pos}</Typography>;
      },
    },
  ];
};

export default useColumns;
