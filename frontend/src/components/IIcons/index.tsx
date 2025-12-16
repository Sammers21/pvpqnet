import USSvg from "./us.svg?react";
import EUSvg from "./eu.svg?react";

import DiscordSvg from "./discord.svg?react";
import GitHubSvg from "./github.svg?react";
import XSvg from "./x.svg?react";

export const UsIcon = (props: any) => {
  return <USSvg {...props} height={32} width={32} />;
};
export const EuIcon = (props: any) => {
  return <EUSvg {...props} height={32} width={32} />;
};

export const DiscordIcon = (props: any) => {
  return <DiscordSvg {...props} />;
};

export const GitHubIcon = (props: any) => {
  return <GitHubSvg {...props} />;
};

export const XIcon = (props: any) => {
  return <XSvg {...props} />;
};
