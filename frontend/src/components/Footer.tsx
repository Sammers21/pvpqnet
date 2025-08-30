import { DiscordIcon, GitHubIcon } from "@/components/IIcons";
import ExternalLink from "@/components/ExternalLink";
import { getClassIcon, getClassNameColor } from "@/utils/table";
import { containerBg } from "@/theme";

const Footer = () => {
  const priest = getClassIcon("PRIEST");
  const priestColor = getClassNameColor("PRIEST");
  // const deathKnight = getClassIcon('DEATH KNIGHT');
  // const deathKnightColor = getClassNameColor('DEATH KNIGHT');
  return (
    <div
      className="flex justify-between flex-wrap py-1 px-4 md:px-8 fixed bottom-0 left-0 w-full border-solid border-t border-[#2f384de6]"
      style={{ backgroundColor: containerBg }}
    >
      <div className="pr-4">
        Made by&nbsp;
        <img className="inline-block w-6 h-6 mx-1" src={priest} alt="priest" />
        <ExternalLink
          className="text-[#3f50b5]"
          href="https://github.com/Sammers21"
          color={priestColor}
        >
          Sammers
        </ExternalLink>
        {/*&nbsp; & &nbsp;*/}
        {/*<img className="inline-block w-6 h-6 mx-1" src={deathKnight} alt="death knight" />*/}
        {/*<ExternalLink className="text-[#3f50b5]" href="https://github.com/Starmordar" color={deathKnightColor}>*/}
        {/*  Starmordar*/}
        {/*</ExternalLink>*/}
      </div>

      <div className="flex items-center gap-4">
        <ExternalLink href="https://github.com/Sammers21/pvpqnet">
          <GitHubIcon />
        </ExternalLink>
        <ExternalLink href="https://discord.gg/KcN4Na9A">
          <DiscordIcon />
        </ExternalLink>
      </div>
    </div>
  );
};

export default Footer;
