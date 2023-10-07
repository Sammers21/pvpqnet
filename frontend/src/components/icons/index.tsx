import { ReactComponent as USSvg } from './us.svg';
import { ReactComponent as EUSvg } from './eu.svg';

export const UsIcon = (props: any) => {
  return <USSvg {...props} height={32} width={32} />;
};
export const EuIcon = (props: any) => {
  return <EUSvg {...props} height={32} width={32} />;
};
