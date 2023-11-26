import { GitHubIcon, DiscordIcon } from '@/components/Icons';
import ExternalLink from '@/components/ExternalLink';

const Footer = () => {
  return (
    <div className="flex justify-between flex-wrap py-1 px-4 md:px-8 fixed bottom-0 left-0 bg-zinc-950 w-full border-solid border-t border-[#2f384de6]">
      <div className="pr-4">
        Made by&nbsp;
        <ExternalLink className="text-[#3f50b5]" href="https://github.com/Sammers21">
          Sammers
        </ExternalLink>
        &nbsp;&&nbsp;
        <ExternalLink className="text-[#3f50b5]" href="https://github.com/Starmordar">
          Starmordar
        </ExternalLink>
      </div>

      <div className="flex items-center gap-4">
        <ExternalLink href="https://github.com/Sammers21/wow-pla/issues">
          <GitHubIcon />
        </ExternalLink>
        <ExternalLink href="https://discord.com/users/343752113752506379">
          <DiscordIcon />
        </ExternalLink>
      </div>
    </div>
  );
};

export default Footer;
