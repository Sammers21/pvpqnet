import { ReactComponent as USSvg } from "./us.svg";
import { ReactComponent as EUSvg } from "./eu.svg";

import { ReactComponent as DiscordSvg } from "./discord.svg";
import { ReactComponent as GitHubSvg } from "./github.svg";
import { ReactComponent as XSvg } from "./x.svg";

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
