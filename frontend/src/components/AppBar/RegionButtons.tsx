import { IconButton } from '@mui/material';
import { EuIcon, UsIcon } from '../icons';
import { REGIONS } from '../../constants/region';

const RegionButtons = ({
  region,
  setRegion,
}: {
  region: REGIONS;
  setRegion: (r: REGIONS) => void;
}) => {
  return (
    <>
      <IconButton
        aria-label="eu"
        sx={region !== REGIONS.eu ? { filter: 'grayscale(100%)' } : {}}
        disableRipple
        onClick={() => setRegion(REGIONS.eu)}
      >
        <EuIcon />
      </IconButton>
      <IconButton
        aria-label="us"
        sx={region !== REGIONS.us ? { filter: 'grayscale(100%)' } : {}}
        disableRipple
        onClick={() => setRegion(REGIONS.us)}
      >
        <UsIcon />
      </IconButton>
    </>
  );
};

export default RegionButtons;
