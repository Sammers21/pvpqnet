import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { generatePath } from 'react-router';

import { Button } from '@mui/material';
import { styled } from '@mui/system';

import { getActivityFromUrl, getBracket, getRegion } from '../../utils/urlparts';
import { publicUrls } from '../../config';
import { BRACKETS } from '../../constants/pvp-activity';
import { borderColor } from '../../theme';

interface IProps {
  statistic: Record<BRACKETS, string> | undefined;
}

export const TabButton = styled(Button)<{ isActive: boolean }>(({ isActive }) => {
  return {
    color: 'white',
    flexGrow: 1,
    borderRadius: 0,
    borderColor: borderColor,
    borderRightWidth: 1,
    borderStyle: 'solid',
    textTransform: 'none',
    backgroundColor: isActive ? 'rgb(21, 128, 61, 0.25)' : 'rgba(31, 41, 55, 0.25)',
    '&:hover': {
      backgroundColor: isActive && 'rgb(21, 128, 61, 0.25)',
    },
  };
});

const ActivityTabs = ({ statistic }: IProps) => {
  let navigate = useNavigate();
  const location = useLocation();

  const { region: regionFromUrl, bracket: bracketFromParams } = useParams();

  const bracket = getBracket(bracketFromParams);
  const activity = getActivityFromUrl();
  const region = getRegion(regionFromUrl);

  const handleBracketChange = (bracket: BRACKETS) => {
    const newPath = generatePath(publicUrls.page, { region, activity, bracket });
    navigate(`${newPath}${location.search}`);
  };

  return (
    <div className="flex w-full rounded-t-md border-t border-l border-b border-solid border-[#2f384de6] bg-[#030303e6]">
      <TabButton
        sx={{ borderTopLeftRadius: 5 }}
        onClick={() => handleBracketChange(BRACKETS.shuffle)}
        isActive={bracket === BRACKETS.shuffle}
      >
        Shuffle {statistic?.shuffle && `(${statistic.shuffle})`}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS['2v2'])}
        isActive={bracket === BRACKETS['2v2']}
      >
        2v2 {statistic?.['2v2'] && `(${statistic['2v2']})`}
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS['3v3'])}
        isActive={bracket === BRACKETS['3v3']}
      >
        3v3 {statistic?.['3v3'] && `(${statistic['3v3']})`}
      </TabButton>
      <TabButton
        sx={{ borderTopRightRadius: 5 }}
        onClick={() => handleBracketChange(BRACKETS.rbg)}
        isActive={bracket === BRACKETS.rbg}
      >
        RBG {statistic?.rbg && `(${statistic.rbg})`}
      </TabButton>
    </div>
  );
};

export default ActivityTabs;
