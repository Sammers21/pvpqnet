import { useMemo, useState } from "react";
import { createBreakpoint } from "react-use";

import Table from "./Table";
import BracketTabs from "./BracketTabs";
import HistoryIcon from "@mui/icons-material/History";

import type { Player } from "@/types";
import { tableColumns } from "./columns";
import { getGamingHistoryRows } from "@/utils/profile";

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const GamingHistory = ({
  player,
  isMobile,
}: {
  player: Player;
  isMobile: boolean;
}) => {
  const breakpoints = useBreakpoint();
  let initialBracket = "all";
  try {
    const has3v3History = player.brackets.find(
      (bracket) =>
        bracket.bracket_type === "ARENA_3v3" &&
        bracket.gaming_history.history.length > 0
    );

    if (has3v3History) {
      initialBracket = "ARENA_3v3";
    } else {
      // Default to "all" if no 3v3 history
      const bracketsWithHistory = player.brackets.filter(
        (bracket) => bracket.gaming_history.history.length > 0
      );
      if (bracketsWithHistory.length > 0) initialBracket = "all";
    }
  } catch (e) {
    initialBracket = "all";
  }
  const [activeBracketName, setBracketName] = useState(initialBracket);
  const bracket = useMemo(() => {
    return player.brackets.find(
      (bracket) => bracket.bracket_type === activeBracketName
    );
  }, [player, activeBracketName]);
  const handleHistBracketChange = (
    _evt: React.SyntheticEvent,
    newValue: string
  ) => {
    setBracketName(newValue);
  };
  const records = useMemo(() => {
    if (activeBracketName === "all") {
      return player.brackets?.flatMap((bracket) =>
        getGamingHistoryRows(bracket)
      );
    }
    return getGamingHistoryRows(bracket);
  }, [player, bracket, activeBracketName]);
  return (
    <div className="flex flex-col p-3 md:p-4 border border-solid border-slate-600/40 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/70 shadow-lg">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <HistoryIcon className="!w-6 !h-6 text-[#60A5FACC]" />
          <span className="text-2xl font-semibold text-white">History</span>
          {records.length > 0 && (
            <span className="text-sm text-slate-400 ml-2">
              ({records.length} games)
            </span>
          )}
        </div>
        <BracketTabs
          player={player}
          onChange={handleHistBracketChange}
          activeBracketName={activeBracketName}
          isMobile={isMobile}
        />
      </div>
      <hr className="h-px md:mb-3 bg-slate-600/40 border-0" />
      <Table
        columns={tableColumns(player, activeBracketName, breakpoints === "sm")}
        records={records}
        isMobile={breakpoints === "sm"}
      />
    </div>
  );
};

export default GamingHistory;
