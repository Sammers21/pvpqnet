import { Button } from "@mui/material";
import PlayersSearch from "@/components/SearchBar";
import RegionButtons from "./RegionButtons";

import { REGION } from "@/constants/region";

interface IProps {
  host: string;
  menuItems: { label: string; onClick: () => void }[];
  region: REGION;
  setRegion: (r: REGION) => void;
}

const DesktopView = ({ menuItems, host, region, setRegion }: IProps) => {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center justify-start">
        <div className="flex items-center justify-start">
          <a
            href="/"
            className="sm:flex hidden ml-20 mr-5 font-bold tracking-wider text-xl"
          >
            {host}
          </a>

          {menuItems.map((item) => (
            <Button
              key={item.label}
              className="!text-[#60a5fa]"
              onClick={item.onClick}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center w-[356px]">
          <PlayersSearch />
      </div>
      <div className="flex items-center justify-end mr-20">
        <RegionButtons region={region} setRegion={setRegion} />
      </div>
    </div>
  );
};

export default DesktopView;
