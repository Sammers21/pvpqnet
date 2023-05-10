import Link from '@mui/material/Link';

import GitHubIcon from '@mui/icons-material/GitHub';

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

      <Link className="flex" underline="none" href="https://github.com/Sammers21/wow-pla/issues">
        Have a problem? Report here
        <GitHubIcon className="ml-2" />
      </Link>
    </div>
  );
};

export default Footer;
