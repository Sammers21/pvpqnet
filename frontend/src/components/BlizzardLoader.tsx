import { cn } from '@/utils/classnames';

interface IProps {
  className?: string;
}
const BlizzardLoader = ({ className }: IProps) => {
  // Spinner removed; skeletons on pages provide loading affordance
  return null;
};

export default BlizzardLoader;
