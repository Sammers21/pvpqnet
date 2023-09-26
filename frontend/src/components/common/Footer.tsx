import Link from '@mui/material/Link';

import GitHubIcon from '@mui/icons-material/GitHub';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDiscord } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <div className="flex justify-between flex-wrap py-2 px-8 fixed bottom-0 left-0 bg-zinc-950 w-full border-solid border-t border-[#2f384de6]">
      <div className="pr-4">
        Made by<span> </span>
        <Link underline="none" href="https://github.com/Sammers21">
          Sammers
        </Link>
        <span> </span>&<span> </span>
        <Link underline="none" href="https://github.com/Starmordar">
          Starmordar
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link color="#FFFFFF" underline="none" href="https://github.com/Sammers21/wow-pla/issues">
          <GitHubIcon />
        </Link>
        <Link color="#FFFFFF" href="https://discord.com/users/343752113752506379">
          <FontAwesomeIcon icon={faDiscord} />
        </Link>
      </div>
    </div>
  );
};

export default Footer;
