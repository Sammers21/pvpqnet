import { useMemo, useState } from "react";
import { createBreakpoint } from "react-use";

import Table from "./Table";
import { tableColumns } from "./columns";
import type { Player } from "@/types";
import {
  Button,
  FormControlLabel,
  LinearProgress,
  Switch,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getProfile } from "@/services/stats.service";

type TPvpBracket =
  | "BLITZ"
  | "SHUFFLE"
  | "ARENA_2v2"
  | "ARENA_3v3"
  | "BATTLEGROUNDS";
const bracketsList: TPvpBracket[] = [
  "SHUFFLE",
  "BLITZ",
  "ARENA_2v2",
  "ARENA_3v3",
  "BATTLEGROUNDS",
];

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const Alts = ({
  player,
  updatePlayer,
}: {
  player: Player;
  updatePlayer?: () => void;
}) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);

  const [updateStatus, setUpdateStatus] = useState<
    Record<string, "pending" | "success" | "error">
  >({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressCount, setProgressCount] = useState(0);

  const [updatedAlts, setUpdatedAlts] = useState<
    Record<string, { data: Player; timestamp: number }>
  >({});

  const handleUpdateAll = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setProgressCount(0);

    const altsToUpdate = player.alts || [];
    const statusMap: Record<string, "pending" | "success" | "error"> = {};

    // Initialize all to pending
    altsToUpdate.forEach((alt) => {
      statusMap[`${alt.name}-${alt.realm}`] = "pending";
    });
    setUpdateStatus({ ...statusMap });

    // Process updates sequentially
    let completed = 0;
    for (const alt of altsToUpdate) {
      const key = `${alt.name}-${alt.realm}`;
      try {
        const result = await getProfile(
          player.region,
          alt.realm,
          alt.name,
          true
        );
        const success = result.playerStatus === 200;
        setUpdateStatus((prev) => ({
          ...prev,
          [key]: success ? "success" : "error",
        }));
        if (success) {
          setUpdatedAlts((prev) => ({
            ...prev,
            [key]: { data: result.player, timestamp: Date.now() },
          }));
        }
      } catch (error) {
        setUpdateStatus((prev) => ({ ...prev, [key]: "error" }));
      }
      completed++;
      setProgressCount(completed);
    }
    setIsUpdating(false);
    if (updatePlayer) updatePlayer();
  };

  const breakpoints = useBreakpoint();
  const sortableAlts = useMemo(() => {
    const records = showCurrent
      ? [player, ...(player?.alts ?? [])]
      : player?.alts ?? [];

    // Process bracket data
    const processed = records.map((alt) => {
      const key = `${alt.name}-${alt.realm}`;
      const updateInfo = updatedAlts[key];
      const sourceAlt = updateInfo ? updateInfo.data : alt;

      const altCopy = structuredClone(sourceAlt);
      altCopy.brackets?.forEach((bracket) => {
        const isShuffle = bracket.bracket_type.startsWith("SHUFFLE");
        const isBlitz = bracket.bracket_type.startsWith("BLITZ");
        if (isShuffle) {
          altCopy["SHUFFLE"] = Math.max(
            altCopy["SHUFFLE"] || 0,
            bracket.rating
          );
        } else if (isBlitz) {
          altCopy["BLITZ"] = Math.max(altCopy["BLITZ"] || 0, bracket.rating);
        } else altCopy[bracket.bracket_type as TPvpBracket] = bracket.rating;
      });
      bracketsList.forEach((bracket) => {
        if (!altCopy[bracket]) altCopy[bracket] = 0;
      });

      if (updateInfo) {
        (altCopy as any)._updatedAt = updateInfo.timestamp;
      }

      return altCopy;
    });

    if (!hideInactive) return processed;

    // Filter inactive
    return processed.filter((alt) => {
      const hasRating = bracketsList.some((b) => (alt[b] as number) > 0);
      return hasRating;
    });
  }, [player, showCurrent, hideInactive, updatedAlts]);

  // Filter columns to hide those where all values are 0 or empty
  const filteredColumns = useMemo(() => {
    const allColumns = tableColumns(breakpoints === "sm", updateStatus);
    const hasStatus =
      isUpdating || (updateStatus && Object.keys(updateStatus).length > 0);

    return allColumns.filter((column) => {
      // Always show the name column
      if (column.field === "name") return true;
      // Show status ONLY if updates are active or exist
      if (column.field === "status") {
        return !!hasStatus;
      }
      // Check if any record has a non-zero value for this bracket
      return sortableAlts.some((alt) => {
        const value = alt[column.field as TPvpBracket];
        return typeof value === "number" && value > 0;
      });
    });
  }, [sortableAlts, breakpoints, updateStatus, isUpdating]);

  if (!player.alts?.length && !showCurrent) return null;
  // If showing current, but alts empty, we still render.
  // But original code: if (!sortableAlts.length) return null;
  if (!sortableAlts.length) return null;

  return (
    <div className="flex flex-col md:px-4 py-4 border border-solid border-slate-600/40 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-800/70 shadow-lg relative overflow-hidden">
      {isUpdating && (
        <div className="absolute top-0 left-0 w-full z-10">
          <LinearProgress
            variant="determinate"
            value={(progressCount / (player.alts?.length || 1)) * 100}
            sx={{
              backgroundColor: "transparent",
              height: "3px",
              "& .MuiLinearProgress-bar": {
                background: "linear-gradient(90deg, #3B82F6 0%, #06B6D4 100%)",
                boxShadow: "0 0 10px 2px rgba(6, 182, 212, 0.5)",
              },
            }}
          />
        </div>
      )}
      <div className="flex justify-between items-center px-3 md:px-0 mb-2 mt-1">
        <div className="flex items-center gap-2">
          <PeopleAltIcon className="!w-6 !h-6 text-[#60A5FACC]" />
          <span className="text-2xl font-semibold text-white">Alts</span>
          <span className="text-sm text-[#9CA3AF] ml-2">
            ({sortableAlts.length} chars)
          </span>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleUpdateAll}
            disabled={isUpdating}
            sx={{
              ml: 2,
              color: "#fff",
              background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
              "&:hover": {
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
              },
              "&:disabled": {
                background: "rgba(148, 163, 184, 0.1)",
                color: "rgba(148, 163, 184, 0.5)",
                boxShadow: "none",
              },
              textTransform: "none",
              minWidth: "140px",
              borderRadius: "8px",
              padding: "6px 16px",
              fontSize: "0.80rem",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
              transition: "all 0.2s ease",
            }}
          >
            {isUpdating
              ? `Updating ${progressCount}/${player.alts?.length || 0}...`
              : "Update All"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <FormControlLabel
            control={
              <Switch
                checked={hideInactive}
                onChange={(e) => setHideInactive(e.target.checked)}
                size="small"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#60A5FA" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#60A5FA",
                  },
                }}
              />
            }
            label={
              <span className="text-xs text-[#9CA3AF]">Hide Inactive</span>
            }
            labelPlacement="start"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showCurrent}
                onChange={(e) => setShowCurrent(e.target.checked)}
                size="small"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#60A5FA" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#60A5FA",
                  },
                }}
              />
            }
            label={<span className="text-xs text-[#9CA3AF]">Current</span>}
            labelPlacement="start"
          />
        </div>
      </div>
      <hr className="h-px md:my-2 bg-slate-600/40 border-0" />
      <Table
        columns={filteredColumns}
        records={sortableAlts}
        isMobile={breakpoints === "sm"}
      />
    </div>
  );
};

export default Alts;
