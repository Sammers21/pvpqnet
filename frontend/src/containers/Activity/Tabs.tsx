import { useNavigate, useLocation, useParams } from "react-router-dom";
import { generatePath } from "react-router";
import { useWindowSize } from "react-use";
import { twMerge } from "tailwind-merge";

import { getActivityFromUrl, getBracket, getRegion } from "@/utils/urlparts";
import { publicUrls } from "@/config";
import { BRACKETS } from "@/constants/pvp-activity";

interface IProps {
  bracketActivity: Record<BRACKETS, string> | undefined;
}

export const BracketCount = ({
  content,
  width,
}: {
  content: number | string | undefined;
  width?: number;
}) => {
  if (!content) return null;
  if (typeof content === "string") {
    content = parseInt(content);
  }
  // Hide on very small screens (< 480px)
  if (width && width < 480) {
    return null;
  }
  if (content > 1000 && width && width < 768) {
    content = `${(content / 1000).toFixed(0)}k`;
  }
  return (
    <div className="ml-1 flex items-center sm:ml-2">
      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-sky-300 sm:rounded-md sm:px-2 sm:text-[11px]">
        {content}
      </span>
    </div>
  );
};

const TabButton = ({
  isActive,
  onClick,
  children,
  className,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={twMerge(
        "flex-grow min-w-0 px-1 py-2.5 text-xs font-medium transition-all duration-200 ease-in-out sm:px-3 sm:py-3 sm:text-sm md:px-4 md:py-3.5 md:text-[15px]",
        "border-r border-slate-700/50 last:border-r-0 focus:outline-none",
        isActive
          ? "bg-gradient-to-b from-sky-500/10 to-sky-600/5 text-sky-100 shadow-[inset_0_-2px_0_rgba(56,189,248,0.7)] font-semibold"
          : "bg-transparent text-slate-400 hover:bg-slate-800/25 hover:text-sky-100",
        className
      )}
    >
      <div className="flex items-center justify-center tracking-wide">
        {children}
      </div>
    </button>
  );
};

const ActivityTabs = ({ bracketActivity }: IProps) => {
  let navigate = useNavigate();
  const location = useLocation();
  const { width } = useWindowSize();

  const { region: regionFromUrl, bracket: bracketFromParams } = useParams();

  const bracket = getBracket(bracketFromParams);
  const activity = getActivityFromUrl();
  const region = getRegion(regionFromUrl);

  const handleBracketChange = (bracket: BRACKETS) => {
    const newPath = generatePath(publicUrls.page, {
      region,
      activity,
      bracket,
    });
    navigate(`${newPath}${location.search}`);
  };

  return (
    <div className="flex w-full overflow-hidden border-b border-slate-700/40 bg-gradient-to-b from-slate-800/50 via-slate-900/60 to-slate-950/70">
      <TabButton
        onClick={() => handleBracketChange(BRACKETS.shuffle)}
        isActive={bracket === BRACKETS.shuffle}
      >
        Shuffle
        <BracketCount content={bracketActivity?.shuffle} width={width} />
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS["2v2"])}
        isActive={bracket === BRACKETS["2v2"]}
      >
        2v2
        <BracketCount content={bracketActivity?.["2v2"]} width={width} />
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS["3v3"])}
        isActive={bracket === BRACKETS["3v3"]}
      >
        3v3 <BracketCount content={bracketActivity?.["3v3"]} width={width} />
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS.blitz)}
        isActive={bracket === BRACKETS.blitz}
      >
        Blitz
        <BracketCount content={bracketActivity?.blitz} width={width} />
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS.rbg)}
        isActive={bracket === BRACKETS.rbg}
      >
        RBG <BracketCount content={bracketActivity?.rbg} width={width} />
      </TabButton>
    </div>
  );
};

export default ActivityTabs;
