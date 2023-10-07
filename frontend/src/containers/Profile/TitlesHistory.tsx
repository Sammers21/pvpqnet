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
import { getSeasonRankImage } from '../../utils/table';
import { getSeasonTitleDescription, getSeasonTitle } from '../../utils/profile';

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
          <Accordion key={expansion.name} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>{expansion.name}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {expansion.seasons
                .slice()
                .reverse()
                .map((season) => {
                  const imageSrc = getSeasonRankImage(season.rank);
                  const { name, title } = getSeasonTitle(season.highest_achievement.name);

                  return (
                    <div key={name} className="flex items-start mb-4">
                      <img className="w-12 h-12 mr-4" src={imageSrc} alt="achievement" />
                      <div className="flex flex-col">
                        <span className="text-xs text-[#60A5FACC]">{name}</span>
                        <span>{title}</span>
                        <span className="text-xs mt-1">
                          {getSeasonTitleDescription(title, season.highest_achievement.name)}
                        </span>
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
