import {alpha, Box, Divider, Typography} from "@mui/material";
import {aroundColor, winRateGreyColor} from "../../theme";

const PvpBracketBox = ({bracket, rating, wins, loses}) => {
  let shortBracketName = bracket;
  if (bracket.startsWith('ARENA')) {
    shortBracketName = bracket.split('_')[1];
  }
  if (bracket === 'BATTLEGROUNDS') {
    shortBracketName = 'RBG';
  }
  const wonColor = wins > 0 ? 'green' : 'white';
  const lostColor = loses > 0 ? '#ff0000' : 'white';
  const winRate = wins && ((wins * 100) / (wins + loses)).toFixed(2) + `%`;
  const showWinRate = wins > 0 || loses > 0;
  let ratingColor = 'white';
  if (rating >= 2400) {
    ratingColor = '#fb7e00';
  } else if (rating >= 2100) {
    ratingColor = '#0d47a1'
  } else if (rating >= 1800) {
    ratingColor = '#a335ee';
  }
  return (
    <Box width="100%"
         marginX={1}
         marginY={1}
         padding={1}
         borderRadius={1}
         sx={{
           backgroundColor: alpha(aroundColor, 0.3),
         }}>
      <Box display="flex" flexDirection={'column'}>
        <Typography
          variant="h5"
          component="div">{shortBracketName}</Typography>
        <Divider/>
        <Box display={'flex'}>
          <Typography variant="h3" component="div" color={ratingColor}>{rating}</Typography>
          {showWinRate && (<Box m={1} display={'column'}>
            <Box display={'flex'}>
            <Typography variant="h7" component="div" color={wonColor}>{wins}</Typography>
            <Typography variant="h7" component="div" color={winRateGreyColor}> / </Typography>
            <Typography variant="h7" component="div" color={lostColor}>{loses}</Typography>
            </Box>
            <Typography variant="h7" component="div" color={winRateGreyColor}>{winRate + 'win ratio'}</Typography>
          </Box>)}
        </Box>
      </Box>
    </Box>);
};
export default PvpBracketBox;