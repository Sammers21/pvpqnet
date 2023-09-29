import { styled } from '@mui/material/styles';

import {
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Typography,
  AccordionProps,
  AccordionSummaryProps,
} from '@mui/material';
import { IPlayer } from '../../types';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getSeasonAndTitle, getSeasonRankImage } from '../../utils/table';

interface IProps {
  player: IPlayer;
}

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(() => ({
  borderRadius: 8,
  border: '1px solid #37415180',
  backgroundColor: '#2f384d20',
  marginBottom: 8,

  '&:not(:last-child)': {
    borderBottom: 0,
  },
  '&:before': {
    display: 'none',
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary {...props} />
))(({ theme }) => ({
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid #37415180',
}));

const TitlesHistory = ({ player }: IProps) => {
  const expansions = player.achievements?.titles_history.expansions || [];

  return (
    <div className="flex grow justify-start flex-col border border-solid rounded-lg border-[#37415180] px-3 py-4 bg-[#030303e6]">
      <span className="text-2xl mb-4">Titles History</span>

      {expansions.map((expansion) => {
        return (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{expansion.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {expansion.seasons
                .slice()
                .reverse()
                .map((season) => {
                  const imageSrc = getSeasonRankImage(season.rank);
                  const { season: seasonName, title } = getSeasonAndTitle(
                    season.highest_achievement.name
                  );

                  return (
                    <div className="flex items-center mb-4">
                      <img className="w-10 h-10 mr-4" src={imageSrc} alt="achievement" />
                      <div className="flex flex-col">
                        <span className="text-xs text-[#60A5FACC]">{seasonName}</span>
                        <span>{title}</span>
                      </div>
                    </div>
                  );
                })}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
};

export default TitlesHistory;
