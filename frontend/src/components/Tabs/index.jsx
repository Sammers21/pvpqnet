import * as React from 'react';
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {generatePath} from 'react-router';

import {Box, Button} from '@mui/material';
import {styled} from '@mui/system';

import {getActivity, getActivityFromUrl, getBracket, getRegion} from '../../utils/urlparts';
import {baseUrl, publicUrls} from '../../config';
import {BRACKETS} from '../../constants/pvp-activity';
import {borderColor, containerBg} from '../../theme';
import {statsMap} from "../../services/stats.service"
import _ from 'lodash';

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
  const {
    region: regionFromUrl,
    bracket: bracketFromParams,
  } = useParams();
  const bracket = getBracket(bracketFromParams);
  const activity = getActivityFromUrl();
  const region = getRegion(regionFromUrl);
  const isActivity = activity ==="activity";
  const handleBracketChange = (bracket) => {
    const newPath = generatePath(publicUrls.page, { region, activity, bracket }) + window.location.search;
    navigate(newPath);
  };
  const init = {
    "2v2": "",
    "3v3": "",
    "rbg": "",
    "shuffle": ""
  }
  const [data, setData] = useState(init);
    useEffect(() => {
      if(isActivity) {
        fetch(baseUrl + "/api/" + statsMap[region] + "/activity/stats")
          .then(res => res.json())
          .then(
            (result) => {
              const res = {};
              Object.keys(result).forEach(function (k) {
                res[k] = "(" + result[k] + ")";
              })
              if(!_.isEqual(data,res)){
                setData(res)
              }
            },
            (error) => {
            }
          )
      } else {
        setData(init)
      }
    })
  return (
    <Box sx={{
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
        onClick={() => handleBracketChange(BRACKETS.shuffle)}
        isActive={bracket === BRACKETS.shuffle}
      >
        Shuffle{data.shuffle}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS['2v2'])}
        isActive={bracket === BRACKETS['2v2']}
      >
        2v2{data["2v2"]}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS['3v3'])}
        isActive={bracket === BRACKETS['3v3']}
      >
        3v3{data["3v3"]}
      </TabButton>
      <TabButton
        sx={{ borderTopRightRadius: 5 }}
        onClick={() => handleBracketChange(BRACKETS.rbg)}
        isActive={bracket === BRACKETS.rbg}
      >
        RBG{data.rbg}
      </TabButton>
    </Box>
  );
}
