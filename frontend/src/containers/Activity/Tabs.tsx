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
      borderColor: borderColor,
      borderRightWidth: 1,
      borderStyle: "solid",
      textTransform: "none",
      fontSize: 16,
      fontWeight: 1000,
      backgroundColor: isActive
        ? "rgb(21, 128, 61, 0.25)"
        : "rgba(31, 41, 55, 0.25)",
      "&:hover": {
        backgroundColor: isActive && "rgb(21, 128, 61, 0.25)",
      },
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
    <div className="flex items-center justify-between ml-0 sm:ml-2">
      <Chip className="!text-sm" label={content} size="small" />
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
    <div className="flex w-full rounded-t-md border-t border-l border-b border-solid border-[#2f384de6] bg-[#030303e6]">
      <TabButton
        sx={{ borderTopLeftRadius: 5 }}
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
        sx={{}}
        onClick={() => handleBracketChange(BRACKETS.blitz)}
        isActive={bracket === BRACKETS.blitz}
      >
        Blitz
        <BracketCount content={bracketActivity?.blitz} width={width} />
      </TabButton>
      <TabButton
        sx={{}}
        onClick={() => handleBracketChange(BRACKETS.rbg)}
        isActive={bracket === BRACKETS.rbg}
      >
        RBG <BracketCount content={bracketActivity?.rbg} width={width} />
      </TabButton>
    </div>
  );
};

export default ActivityTabs;
