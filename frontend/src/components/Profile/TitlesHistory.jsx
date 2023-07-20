import {alpha, Divider, Typography} from "@mui/material";
import Box from "@mui/material/Box";
import * as React from "react";
import {aroundColor, borderRadius} from "../../theme";
import Paper from '@mui/material/Paper';

const TitlesHistory = ({expansions}) => {
  return (<Box sx={{
    backgroundColor: alpha(aroundColor, 0.3),
    borderRadius: borderRadius,
    marginTop: '15px', marginBottom: '15px',
    width: '100%',
    paddingTop: '15px',
    paddingBottom: '15px',
    paddingLeft: '15px',
    paddingRight: '15px',
  }}>
    <Typography gutterBottom variant="h5" component="div">Titles History</Typography>
    <Divider/>
    {expansions.map((expansion) => {
      let ssns = expansion.seasons
      const reversed = ssns.slice().reverse();
      const seasons = reversed.map((season) => {
        const rank = season.rank
        let rankImg
        if (rank === 'r1_3s') {
          rankImg = 'rank_10.png'
        } else if (rank === 'r1_shuffle') {
          rankImg = 'rank_10.png'
        } else if (rank === 'Gladiator') {
          rankImg = 'rank_9.png'
        } else if (rank === 'Legend') {
          rankImg = 'rank_legend.png'
        } else if (rank === 'Elite') {
          rankImg = 'rank_8.png'
        } else if (rank === 'Duelist') {
          rankImg = 'rank_7.png'
        } else if (rank === 'Rival') {
          rankImg = 'rank_6.png'
        } else if (rank === 'Challenger') {
          rankImg = 'rank_4.png'
        } else if (rank === 'Combatant') {
          rankImg = 'rank_2.png'
        } else {
          rankImg = 'rank_2.png'
        }
        let pic = require('../../assets/ranks/' + rankImg);
        return (<Box sx={{
          display: 'flex', alignItems: 'center',
        }}
        >
          <img src={pic} width={56} height={56}/>
          <Box>
            <Typography variant="h7" color="text.secondary">{season.highest_achievement.name}</Typography>
          </Box>
        </Box>)
      })
      return (<Box sx={{
        paddingTop: '15px', paddingBottom: '15px', paddingLeft: '15px', paddingRight: '15px',
      }}>
        {/*<Paper >*/}
          <Typography variant="h6" color="text.secondary">{expansion.name}</Typography>
        {/*</Paper>*/}
        <Divider sx={{
          marginBottom: '5px',
        }}/>
        {seasons}
      </Box>)
    })}
  </Box>);
}

export default TitlesHistory;