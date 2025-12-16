import { useState, useRef, useMemo } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { ClickAwayListener, Popper, Paper, Grow } from "@mui/material";
import {
  getCurrentSeason,
  getSeasonsWithHistory,
  type WowSeason,
} from "@/constants/seasons";
import type { Player } from "@/types";

interface IProps {
  selectedSeason: WowSeason;
  onSeasonChange: (season: WowSeason) => void;
  player: Player;
}

const SeasonSelector = ({ selectedSeason, onSeasonChange, player }: IProps) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const currentSeason = getCurrentSeason();
  const isCurrentSeason = selectedSeason.id === currentSeason.id;
  // Get all history timestamps from player brackets
  const availableSeasons = useMemo(() => {
    const allTimestamps: number[] = [];
    player.brackets?.forEach((bracket) => {
      bracket.gaming_history?.history?.forEach((entry) => {
        if (entry.diff?.timestamp) {
          allTimestamps.push(entry.diff.timestamp);
        }
      });
    });
    return getSeasonsWithHistory(allTimestamps);
  }, [player]);
  const handleToggle = () => {
    setOpen((prev) => !prev);
  };
  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current?.contains(event.target as HTMLElement)) {
      return;
    }
    setOpen(false);
  };
  const handleSelect = (season: WowSeason) => {
    onSeasonChange(season);
    setOpen(false);
  };
  // Group available seasons by expansion
  const expansionGroups = availableSeasons.reduce((acc, season) => {
    if (!acc[season.expansion]) {
      acc[season.expansion] = [];
    }
    acc[season.expansion].push(season);
    return acc;
  }, {} as Record<string, WowSeason[]>);
  return (
    <div className="relative">
      <button
        ref={anchorRef}
        onClick={handleToggle}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-solid transition-all duration-200 ${
          isCurrentSeason
            ? "bg-slate-800/80 border-slate-600/40 hover:border-sky-500/40"
            : "bg-amber-500/10 border-amber-400/30 hover:border-amber-400/50"
        }`}
      >
        <span className="text-sm font-medium text-white">
          {selectedSeason.name}
        </span>
        <KeyboardArrowDownIcon
          className={`!w-5 !h-5 text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: "top left" }}>
            <Paper
              className="!bg-slate-900/98 !border !border-solid !border-slate-600/40 !rounded-xl !shadow-2xl !mt-1 !backdrop-blur-sm"
              sx={{ minWidth: 260, maxHeight: 400, overflow: "auto" }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <div className="py-2">
                  {Object.entries(expansionGroups).map(
                    ([expansion, seasons]) => (
                      <div key={expansion}>
                        <div className="px-3 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {expansion}
                        </div>
                        {seasons.map((season) => {
                          const isSelected = season.id === selectedSeason.id;
                          const isCurrent = season.id === currentSeason.id;
                          return (
                            <button
                              key={season.id}
                              onClick={() => handleSelect(season)}
                              className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors duration-150 ${
                                isSelected
                                  ? "bg-sky-500/20 text-white"
                                  : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                              }`}
                            >
                              <span className="text-sm font-medium">
                                {season.name}
                              </span>
                              {isCurrent && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Live
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </div>
  );
};

export default SeasonSelector;
