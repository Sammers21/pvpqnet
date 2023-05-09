import { ReactComponent as USSvg } from './us.svg';
import { ReactComponent as EUSvg } from './eu.svg';

interface IProps {
  className?: string;
  color?: string;
}

export const UsIcon = (props: IProps) => <USSvg height={32} width={32} {...props} />;
export const EuIcon = (props: IProps) => <EUSvg height={32} width={32} {...props} />;
