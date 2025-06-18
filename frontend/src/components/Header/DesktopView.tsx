import { Button } from "@mui/material";
import PlayersSearch from "@/components/SearchBar";
import RegionButtons from "./RegionButtons";

import { REGION } from "@/constants/region";
import { Link} from "react-router-dom";
import { useEffect, useRef, useState } from "react";

interface IProps {
  host: string;
  menuItems: { label: string; onClick: () => void }[];
  region: REGION;
  setRegion: (r: REGION) => void;
}




const DesktopView = ({ menuItems, host, region, setRegion }: IProps) => {
  const [pageNow,setPageNow] = useState<number>(0);
  const [blockPosition,setBlockPosition] = useState<number>(0);
  const [BlockWidth,setBlockWidth] = useState(0);
  const buttonRefs = useRef<HTMLButtonElement[]>([]);
  useEffect(() => {
    const currButton = buttonRefs.current[pageNow]
    if (currButton){
      const par = currButton.parentElement?.parentElement;
      const parRect = par?.getBoundingClientRect()
      const btnRect = currButton?.getBoundingClientRect();
      setBlockPosition(btnRect.left - (parRect?.left || 0))
      setBlockWidth(btnRect.width);
    }
  },[pageNow])
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center justify-start">
        <div className="flex items-center justify-start relative">
          <Link
            to={"/"}
            onClick={() => setPageNow(0)}
            className="sm:flex hidden ml-20 mr-5 font-bold tracking-wider text-xl"
          >
            {host}
          </Link>
          <div style={{transform: `translateX(${blockPosition}px)`,width: `${BlockWidth}px`}} className="transition-all duration-500 rounded-lg  absolute z-100 bg-gray-800 h-[35px]"></div>
          {menuItems.map((item,index) => (
            <Button disableRipple 
              ref={(el) => {
                      buttonRefs.current[index] = el;
                    }}
              key={item.label}
              className={`!text-[#60a5fa] hover:!bg-transparent`}
              onClick={() => {
                item.onClick();
                setPageNow(index)
              }}
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
