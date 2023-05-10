import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { generatePath } from 'react-router';
import isEqual from 'lodash/isEqual';

import { Box, Button } from '@mui/material';
import { styled } from '@mui/system';
import { borderColor, containerBg } from '../../../theme';

import { getActivity, getBracket, getRegion } from '../../../utils/getFromUrl';
import { baseUrl, publicUrls } from '../../../config';

import { BRACKET, BACKEND_REGION, ACTIVITY } from '../../../constants';

interface ITabButtonProps {
  isActive: boolean;
}

const TabButton = styled((props: any) => <Button {...props} />)({
  color: 'white',
  flexGrow: 1,
  borderRadius: 0,
  // backgroundColor: ({ isActive }: ITabButtonProps) =>
  //   isActive ? 'rgb(21, 128, 61, 0.25)' : 'rgba(31, 41, 55, 0.25)',
  borderColor: borderColor,
  borderRightWidth: 1,
  borderStyle: 'solid',
  textTransform: 'none',

  '&:hover': {
    backgroundColor: ({ isActive }: ITabButtonProps) => isActive && 'rgb(21, 128, 61, 0.25)',
  },
});

export default function ActivityTabs() {
  let navigate = useNavigate();
  const {
    region: regionFromUrl,
    activity: activityFromUrl,
    bracket: bracketFromParams,
  } = useParams();

  const bracket = getBracket(bracketFromParams);
  const activity = getActivity(activityFromUrl);
  const region = getRegion(regionFromUrl);
  const isActivity = activity === ACTIVITY.activity;

  const handleBracketChange = (bracket: BRACKET) => {
    const newPath =
      generatePath(publicUrls.activity, { region, activity, bracket }) + window.location.search;
    navigate(newPath);
  };

  const init: Record<BRACKET, string> = {
    '2v2': '',
    '3v3': '',
    rbg: '',
    shuffle: '',
  };

  const [data, setData] = useState(init);
  useEffect(() => {
    if (isActivity) {
      fetch(baseUrl + '/api/' + BACKEND_REGION[region] + '/activity/stats')
        .then((res) => res.json())
        .then((result) => {
          const res: any = {};

          Object.keys(result).forEach(function (k) {
            res[k] = '(' + result[k] + ')';
          });
          if (!isEqual(data, res)) {
            setData(res);
          }
        });
    } else {
      setData(init);
    }
  });

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
        onClick={() => handleBracketChange(BRACKET.shuffle)}
        isActive={bracket === BRACKET.shuffle}
      >
        Shuffle{data.shuffle}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKET['2v2'])}
        isActive={bracket === BRACKET['2v2']}
      >
        2v2{data['2v2']}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKET['3v3'])}
        isActive={bracket === BRACKET['3v3']}
      >
        3v3{data['3v3']}
      </TabButton>
      <TabButton
        sx={{ borderTopRightRadius: 5 }}
        onClick={() => handleBracketChange(BRACKET.rbg)}
        isActive={bracket === BRACKET.rbg}
      >
        RBG{data.rbg}
      </TabButton>
    </Box>
  );
}
