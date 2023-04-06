import * as React from 'react';
import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {generatePath} from 'react-router';

import {Box, Button} from '@mui/material';
import {styled} from '@mui/system';

import {getActivity, getDiscipline, getRegion} from '../../utils/urlparts';
import {baseUrl, publicUrls} from '../../config';
import {DISCIPLINES} from '../../constants/pvp-activity';
import {borderColor, containerBg} from '../../theme';
import {statsMap} from "../../services/stats.service"

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
    activity: activityFromUrl,
    discipline: disciplineFromParams,
  } = useParams();
  const discipline = getDiscipline(disciplineFromParams);
  const activity = getActivity(activityFromUrl);
  const region = getRegion(regionFromUrl);
  const isActivity = activity ==="activity";
  const handleBracketChange = (bracket) => {
    const newPath = generatePath(publicUrls.page, { region, activity, discipline: bracket });
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
              setData(res)
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
        onClick={() => handleBracketChange(DISCIPLINES.shuffle)}
        isActive={discipline === DISCIPLINES.shuffle}
      >
        Shuffle{data.shuffle}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(DISCIPLINES['2v2'])}
        isActive={discipline === DISCIPLINES['2v2']}
      >
        2v2{data["2v2"]}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(DISCIPLINES['3v3'])}
        isActive={discipline === DISCIPLINES['3v3']}
      >
        3v3{data["3v3"]}
      </TabButton>
      <TabButton
        sx={{ borderTopRightRadius: 5 }}
        onClick={() => handleBracketChange(DISCIPLINES.rbg)}
        isActive={discipline === DISCIPLINES.rbg}
      >
        RBG{data.rbg}
      </TabButton>
    </Box>
  );
}
