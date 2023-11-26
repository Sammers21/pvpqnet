import { cn } from '@/utils/classnames';

interface IProps {
  className?: string;
}
const BlizzardLoader = ({ className }: IProps) => {
  return (
    <div className={cn(className, 'absolute top-1/2 right-1/2 translate-x-2/4 -translate-y-2/4')}>
      <div className="loader-container">
        <div className="blizzard-loader one"></div>
        <div className="blizzard-loader two"></div>
        <div className="blizzard-loader three"></div>
      </div>

      <span className="uppercase">Loading...</span>
    </div>
  );
};

export default BlizzardLoader;
