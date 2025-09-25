import { useNavigate, useLocation, useParams } from "react-router-dom";
import { generatePath } from "react-router";
import { Button, Chip } from "@mui/material";
import { styled } from "@mui/system";
import { getActivityFromUrl, getBracket, getRegion } from "@/utils/urlparts";
import { publicUrls } from "@/config";
import { BRACKETS } from "@/constants/pvp-activity";
import { borderColor } from "@/theme";
import { useWindowSize } from "react-use";
interface IProps {
  bracketActivity: Record<BRACKETS, string> | undefined;
}
export const TabButton = styled(Button)<{ isActive: boolean }>(
  ({ isActive }) => {
    return {
      color: "white",
      flexGrow: 1,
      borderRadius: 0,
      borderColor: "rgba(75, 85, 99, 0.3)",
      borderRightWidth: 1,
      borderStyle: "solid",
      textTransform: "none",
      fontSize: "14px",
      fontWeight: 600,
      padding: "12px 8px",
      minHeight: "56px",
      backgroundColor: isActive
        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)"
        : "rgba(31, 41, 55, 0.3)",
      backdropFilter: "blur(10px)",
      transition: "all 0.2s ease-in-out",
      position: "relative",
      "&:hover": {
        backgroundColor: isActive
          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)"
          : "rgba(59, 130, 246, 0.1)",
        transform: "translateY(-1px)",
      },
      "&::after": isActive
        ? {
            content: '""',
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: "linear-gradient(90deg, #3b82f6 0%, #10b981 100%)",
          }
        : {},
    };
  }
);
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
  if (content > 1000 && width && width < 768) {
    content = `${(content / 1000).toFixed(0)}k`;
  }
  return (
    <div className="flex items-center justify-center ml-1 sm:ml-2">
      <Chip
        className="!text-xs !font-semibold !bg-gradient-to-r !from-blue-500/20 !to-emerald-500/20 !border !border-blue-400/30 !text-blue-100"
        label={content}
        size="small"
      />
    </div>
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
    <div className="flex w-full bg-gradient-to-r from-gray-800/50 to-gray-900/50 backdrop-blur-sm border-b border-gray-700/50">
      <TabButton
        sx={{ borderTopLeftRadius: 8 }}
        onClick={() => handleBracketChange(BRACKETS.shuffle)}
        isActive={bracket === BRACKETS.shuffle}
      >
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm font-semibold">Shuffle</span>
          <BracketCount content={bracketActivity?.shuffle} width={width} />
        </div>
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS["2v2"])}
        isActive={bracket === BRACKETS["2v2"]}
      >
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm font-semibold">2v2</span>
          <BracketCount content={bracketActivity?.["2v2"]} width={width} />
        </div>
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS["3v3"])}
        isActive={bracket === BRACKETS["3v3"]}
      >
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm font-semibold">3v3</span>
          <BracketCount content={bracketActivity?.["3v3"]} width={width} />
        </div>
      </TabButton>
      <TabButton
        onClick={() => handleBracketChange(BRACKETS.blitz)}
        isActive={bracket === BRACKETS.blitz}
      >
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm font-semibold">Blitz</span>
          <BracketCount content={bracketActivity?.blitz} width={width} />
        </div>
      </TabButton>
      <TabButton
        sx={{ borderTopRightRadius: 8, borderRightWidth: 0 }}
        onClick={() => handleBracketChange(BRACKETS.rbg)}
        isActive={bracket === BRACKETS.rbg}
      >
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm font-semibold">RBG</span>
          <BracketCount content={bracketActivity?.rbg} width={width} />
        </div>
      </TabButton>
    </div>
  );
};
export default ActivityTabs;
