import { Tabs, Tab as MuiTab, TabProps, styled } from "@mui/material";

import type { Bracket, Player } from "@/types";
import { getSpecIcon } from "@/utils/table";
import { BracketCount } from "@/containers/Activity/Tabs";
import { capitalizeFirstLetter } from "@/utils/common";

export const PartyBrackets = {
  ARENA_2v2: "2v2",
  ARENA_3v3: "3v3",
  BATTLEGROUNDS: "RBG",
};

export function isSoloBracket(bracketName: string) {
  return bracketName.startsWith("SHUFFLE") || bracketName.startsWith("BLITZ");
}

const Tab = styled((props: TabProps) => <MuiTab {...props} />)(({ theme }) => ({
  textTransform: "none",
  minWidth: 0,
  [theme.breakpoints.up("sm")]: {
    minWidth: 0,
  },
  fontWeight: theme.typography.fontWeightRegular,
  fontSize: theme.typography.pxToRem(14),
  padding: "8px 16px",
}));

function BracketTab(characterClass, bracket, isMobile) {
  const key = bracket.bracket_type;
  const value = bracket.bracket_type;
  let icon;
  if (bracket.bracket_type in PartyBrackets) {
    icon = (
      <div className="flex items-center">
        <span className="text-base">{PartyBrackets[bracket.bracket_type]}</span>
        {!isMobile && (
          <BracketCount
            content={bracket?.gaming_history?.history?.length ?? 0}
          />
        )}
      </div>
    );
  } else if (isSoloBracket(bracket.bracket_type)) {
    const split = bracket.bracket_type.split("-");
    const bracketType = capitalizeFirstLetter(split[0].toLocaleLowerCase());
    const spec = split[1];
    const specIcon = getSpecIcon(`${spec} ${characterClass}` || "");
    const imgClasses =
      (isMobile ? "h-7 w-7" : "h-7 w-7") +
      " " +
      "ml-1 rounded border border-solid border-[#37415180]";
    icon = (
      <div className="flex items-center">
        <span className="text-base">{bracketType}</span>
        <img className={imgClasses} src={specIcon} alt={spec} />
        {!isMobile && (
          <BracketCount
            content={bracket?.gaming_history?.history?.length ?? 0}
          />
        )}
      </div>
    );
  } else {
    icon = (
      <div className="flex items-center">
        <span className="text-base">{bracket.bracket_type}</span>
      </div>
    );
  }
  return <Tab key={key} value={value} icon={icon} />;
}

const BracketTabs = ({
  player,
  activeBracketName,
  onChange,
  isMobile,
}: {
  player: Player;
  activeBracketName: string;
  onChange: (_evt: React.SyntheticEvent, value: any) => void;
  isMobile: boolean;
}) => {
  const more_than_one_bracket =
    player.brackets.filter((b) => b.gaming_history?.history?.length > 0)
      .length > 1;
  return (
    <Tabs
      className="!min-h-[38px]"
      value={activeBracketName}
      onChange={onChange}
      variant="scrollable"
      scrollButtons={false}
      textColor="primary"
      indicatorColor="primary"
    >
      {more_than_one_bracket && <Tab label="All" value="all" />}
      {player.brackets
        .filter((b) => b.gaming_history?.history?.length > 0)
        .map((bracket) => BracketTab(player.class, bracket, isMobile))}
    </Tabs>
  );
};

export default BracketTabs;
