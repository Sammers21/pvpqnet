import { Button } from '@mui/material';

import PlayersSearch from '../PlayersSearch';
import RegionButtons from './RegionButtons';
import { REGIONS } from '../../constants/region';

interface IProps {
  host: string;
  menuItems: { label: string; onClick: () => void }[];
  region: REGIONS;
  setRegion: (r: REGIONS) => void;
}

const DesktopView = ({ menuItems, host, region, setRegion }: IProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center justify-between w-5/6">
        <div className="flex items-center justify-start">
          <a href="/" className="sm:flex hidden mr-5 font-bold tracking-wider text-xl">
            {host}
          </a>

          {menuItems.map((item) => (
            <Button className="!text-[#60a5fa]" onClick={item.onClick}>
              {item.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center justify-end w-80">
          <PlayersSearch />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <RegionButtons region={region} setRegion={setRegion} />
      </div>
    </div>
  );
};

export default DesktopView;
