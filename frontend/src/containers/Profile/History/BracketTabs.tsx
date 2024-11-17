import { useMemo } from "react";
import { Tabs, Tab as MuiTab, TabProps, styled } from "@mui/material";

import type { Player } from "@/types";
import { CLASS_AND_SPECS } from "@/constants/filterSchema";
import { getSpecIcon } from "@/utils/table";
import { BracketCount } from "@/containers/Activity/Tabs";

const arenaAndRbg = [
  { name: "ARENA_2v2", title: "2v2" },
  { name: "ARENA_3v3", title: "3v3" },
  { name: "BATTLEGROUNDS", title: "RBG" },
];

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

const BracketTabs = ({
  player,
  activeBracketName: value,
  onChange,
  isMobile,
}: {
  player: Player;
  activeBracketName: string;
  onChange: (_evt: React.SyntheticEvent, value: any) => void;
  isMobile: boolean;
}) => {
  const blitzBrackets = useMemo(() => {
    const classAndSpec = CLASS_AND_SPECS[player.class] as string[];
    return classAndSpec
      .map((spec) => {
        const bracket = player?.brackets?.find(
          ({ bracket_type }) =>
            bracket_type.includes(spec) && bracket_type.includes("BLITZ")
        );
        return { bracket, spec };
      })
      .filter(
        ({ bracket, spec }) =>
          bracket !== undefined && bracket.gaming_history.history.length > 0
      );
  }, [player]);
  const shuffleBrackets = useMemo(() => {
    const classAndSpec = CLASS_AND_SPECS[player.class] as string[];
    return classAndSpec
      .map((spec) => {
        const bracket = player?.brackets?.find(
          ({ bracket_type }) =>
            bracket_type.includes(spec) && bracket_type.includes("SHUFFLE")
        );
        return { bracket, spec };
      })
      .filter(
        ({ bracket, spec }) =>
          bracket !== undefined && bracket.gaming_history.history.length > 0
      );
  }, [player]);
  const more_than_one_bracket =
    player.brackets.filter((b) => b.gaming_history?.history?.length > 0)
      .length > 1;
  return (
    <Tabs
      className="!min-h-[38px]"
      value={value}
      onChange={onChange}
      variant="scrollable"
      scrollButtons={false}
      textColor="primary"
      indicatorColor="primary"
    >
      {more_than_one_bracket && <Tab label="All" value="all" />}
      {arenaAndRbg.filter(non_empty_brackets()).map(({ title, name }) => {
        const bracket = player?.brackets?.find(
          ({ bracket_type }) => bracket_type === name
        );
        return (
          <Tab
            key={name}
            value={name}
            icon={
              <div className="flex items-center">
                <span className="text-base">{title}</span>
                {!isMobile && (
                  <BracketCount
                    content={bracket?.gaming_history?.history?.length ?? 0}
                  />
                )}
              </div>
            }
          />
        );
      })}
      {blitzBrackets.map(({ bracket, spec }) => {
        const specIcon = getSpecIcon(`${spec} ${player.class}` || "");
        if (!bracket) return null;
        const imgClasses =
          (isMobile ? "h-7 w-7" : "h-7 w-7") +
          " rounded border border-solid border-[#37415180]";
        return (
          <Tab
            key={spec}
            value={spec}
            icon={
              <div className="flex items-center">
                <span className="text-base">Blitz</span>
                <img className={imgClasses} src={specIcon} alt={spec} />
                {!isMobile && (
                  <BracketCount
                    content={bracket?.gaming_history?.history?.length ?? 0}
                  />
                )}
              </div>
            }
          />
        );
      })}
      {shuffleBrackets.map(({ bracket, spec }) => {
        const specIcon = getSpecIcon(`${spec} ${player.class}` || "");
        if (!bracket) return null;
        const imgClasses =
          (isMobile ? "h-7 w-7" : "h-7 w-7") +
          " rounded border border-solid border-[#37415180]";
        return (
          <Tab
            key={spec}
            value={spec}
            icon={
              <div className="flex items-center">
                <span className="text-base">Shuffle</span>
                <img className={imgClasses} src={specIcon} alt={spec} />
                {!isMobile && (
                  <BracketCount
                    content={bracket?.gaming_history?.history?.length ?? 0}
                  />
                )}
              </div>
            }
          />
        );
      })}
    </Tabs>
  );

  function non_empty_brackets() {
    return ({ title, name }) => {
      const b = player?.brackets?.find(
        ({ bracket_type }) => bracket_type === name
      );
      if (!b) return false;
      return b.gaming_history?.history?.length > 0;
    };
  }
};

export default BracketTabs;
