import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generatePath } from 'react-router';

import { Box, Button } from '@mui/material';
import { styled } from '@mui/system';

import { getDiscipline } from '../../utils/getDiscipline';
import { publicUrls } from '../../config';
import { DISCIPLINES } from '../../constants/pvp-activity';
import { borderColor, containerBg } from '../../theme';

const TabButton = styled(Button)(({ isActive }) => ({
  color: 'white',
  flexGrow: 1,
  borderRadius: 0,
  backgroundColor: isActive ? 'rgb(21, 128, 61, 0.25)' : 'rgba(31, 41, 55, 0.25)',
  borderColor: borderColor,
  borderRightWidth: 1,
  borderStyle: 'solid',
  textTransform: 'none',

  '&:hover': {
    backgroundColor: isActive && 'rgb(21, 128, 61, 0.25)',
  },
}));

export default function ActivityTabs() {
  let navigate = useNavigate();
  const { region, activity, discipline: disciplineFromParams } = useParams();
  const discipline = getDiscipline(disciplineFromParams);

  const handleChangeDiscipline = (discipline) => {
    const newPath = generatePath(publicUrls.page, { region, activity, discipline });
    navigate(newPath);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        borderTopLeftRadius: 5,
        borderTopRightRadius: 5,
        borderTop: `1px ${borderColor} solid`,
        borderLeft: `1px ${borderColor} solid`,
        borderBottom: `1px ${borderColor} solid`,
        backgroundColor: containerBg,
      }}
    >
      <TabButton
        sx={{ borderTopLeftRadius: 5 }}
        onClick={() => handleChangeDiscipline(DISCIPLINES.shuffle)}
        isActive={discipline === DISCIPLINES.shuffle}
      >
        Shuffle
      </TabButton>
      <TabButton
        onClick={() => handleChangeDiscipline(DISCIPLINES['2v2'])}
        isActive={discipline === DISCIPLINES['2v2']}
      >
        2v2
      </TabButton>
      <TabButton
        onClick={() => handleChangeDiscipline(DISCIPLINES['3v3'])}
        isActive={discipline === DISCIPLINES['3v3']}
      >
        3v3
      </TabButton>
      <TabButton
        sx={{ borderTopRightRadius: 5 }}
        onClick={() => handleChangeDiscipline(DISCIPLINES.rbg)}
        isActive={discipline === DISCIPLINES.rbg}
      >
        RBG
      </TabButton>
    </Box>
  );
}
