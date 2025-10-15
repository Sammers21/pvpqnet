import USSvg from './us.svg';
import EUSvg from './eu.svg';
import DiscordSvg  from './discord.svg';
import GitHubSvg from './github.svg';

export const UsIcon = ({className}:{className?:string}) => <img className={className} src={USSvg}></img>
export const EuIcon = ({className}:{className?:string}) => <img className={className} src={EUSvg}></img>
export const DiscordIcon = (props: any) => <img {...props} src={DiscordSvg}></img>
export const GitHubIcon = (props: any) => <img {...props} src={GitHubSvg}></img>
