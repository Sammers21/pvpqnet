import { IconButton } from "@mui/material";
import { EuIcon, UsIcon } from "@/components/IIcons";

import { REGION } from "@/constants/region";

const iconButtonSx = {
  padding: "6px",
  borderRadius: "12px",
  transition: "background-color 0.2s ease, filter 0.2s ease, opacity 0.2s ease",
  "&:hover": {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
};

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
        aria-pressed={region === REGION.eu}
        sx={[
          iconButtonSx,
          region !== REGION.eu
            ? { filter: "grayscale(100%)", opacity: 0.65 }
            : {},
        ]}
        disableRipple
        onClick={() => setRegion(REGION.eu)}
      >
        <EuIcon />
      </IconButton>
      <IconButton
        aria-label="us"
        aria-pressed={region === REGION.us}
        sx={[
          iconButtonSx,
          region !== REGION.us
            ? { filter: "grayscale(100%)", opacity: 0.65 }
            : {},
        ]}
        disableRipple
        onClick={() => setRegion(REGION.us)}
      >
        <UsIcon />
      </IconButton>
    </>
  );
};

export default RegionButtons;
