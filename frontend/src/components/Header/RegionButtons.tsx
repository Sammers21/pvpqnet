import { IconButton } from '@mui/material';
import { EuIcon, UsIcon } from '@/components/IIcons';

import { REGION } from '@/constants/region';

const RegionButtons = ({
  region,
  setRegion,
}: {
  region: REGION;
  setRegion: (r: REGION) => void;
}) => {
  return (
    <>
      <IconButton
        aria-label="eu"
        sx={region !== REGION.eu ? { filter: 'grayscale(100%)' } : {}}
        disableRipple
        onClick={() => setRegion(REGION.eu)}
      >
        <EuIcon className='w-[32px] h-[32px] self-center' />
      </IconButton>
      <IconButton
        aria-label="us"
        sx={region !== REGION.us ? { filter: 'grayscale(100%)' } : {}}
        disableRipple
        onClick={() => setRegion(REGION.us)}
      >
        <UsIcon className='w-[32px] h-[32px] self-center' />
      </IconButton>
    </>
  );
};

export default RegionButtons;
