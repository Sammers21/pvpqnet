import { useMemo, useState } from "react";
import { createBreakpoint } from "react-use";

import Table from "./Table";
import BracketTabs from "./BracketTabs";

import type { IPlayer } from "@/types";
import { tableColumns } from "./columns";
import { getGamingHistoryRows } from "@/utils/profile";

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const GamingHistory = ({ player, isMobile }: { player: IPlayer, isMobile: boolean }) => {
  const breakpoints = useBreakpoint();
  var initialBracket
  try {
    initialBracket = !!player.brackets.find(
      (bracket) =>
        bracket.bracket_type === "ARENA_3v3" &&
        bracket.gaming_history.history.length > 0
    )
      ? "ARENA_3v3"
      : player.brackets
          .filter((bracket) => bracket.gaming_history.history.length > 0)
          .sort(
            (a, b) =>
              b.gaming_history.history[0].diff.timestamp -
              a.gaming_history.history[0].diff.timestamp
          )[0].bracket_type;
    if (initialBracket.includes("SHUFFLE-")) {
      initialBracket = initialBracket.split("SHUFFLE-")[1];
    }
  } catch (e) {
    initialBracket = "all";
  }

  const [active_bracket_name, set_bracket_name] = useState(initialBracket);
  const bracket = useMemo(() => {
    const bracketsList = ["ARENA_2v2", "ARENA_3v3", "BATTLEGROUNDS"];
    const search = bracketsList.includes(active_bracket_name)
      ? active_bracket_name
      : `SHUFFLE-${active_bracket_name}`;
    return player.brackets.find((history) => history.bracket_type === search);
  }, [player, active_bracket_name]);
  const handleChange = (_evt: React.SyntheticEvent, newValue: string) => {
    set_bracket_name(newValue);
  };
  const records = useMemo(() => {
    if (active_bracket_name === "all") {
      return player.brackets?.flatMap((bracket) =>
        getGamingHistoryRows(bracket)
      );
    }
    return getGamingHistoryRows(bracket);
  }, [player, bracket, active_bracket_name]);
  return (
    <div className="flex flex-col py-2 md:px-3 border border-solid border-[#37415180] rounded-lg bg-[#030303e6] ">
      <div className="flex justify-between items-center px-3 md:px-0">
        <span className="text-2xl mr-4">History</span>
        <BracketTabs
          player={player}
          onChange={handleChange}
          active_bracket_name={active_bracket_name}
          isMobile={isMobile}
        />
      </div>
      <hr className="h-px md:mb-2 bg-[#37415180] border-0" />
      <Table
        columns={tableColumns(
          player,
          active_bracket_name,
          breakpoints === "sm"
        )}
        records={records}
        isMobile={breakpoints === "sm"}
      />
    </div>
  );
};

export default GamingHistory;
