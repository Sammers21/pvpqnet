import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBreakpoint } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { Button, LinearProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SyncIcon from "@mui/icons-material/Sync";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import BlizzardLoader from "@/components/BlizzardLoader";
import battleNetLogo from "@/assets/bnet.svg";
import AltsTable from "@/containers/Profile/Alts/Table";
import { tableColumns } from "@/containers/Profile/Alts/columns";
import { getProfile } from "@/services/stats.service";
import { getRegion } from "@/utils/urlparts";
import type { Player } from "@/types";

type CabinetCharacter = {
  id: number;
  name: string;
  realm: string;
  region: string;
  level?: number;
  class?: string;
  race?: string;
  gender?: string;
  resolved?: Player & { hidden?: boolean };
};

type CabinetCharactersResponse = {
  authenticated: boolean;
  battletag?: string;
  region?: string;
  needsInitialUpdate?: boolean;
  characters?: CabinetCharacter[];
  error?: string;
};

type UpdateStatus = Record<string, "pending" | "success" | "error">;
type UpdatedRecords = Record<string, { data: Player; timestamp: number }>;

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });
const BRACKET_FIELDS = [
  "SHUFFLE",
  "BLITZ",
  "ARENA_2v2",
  "ARENA_3v3",
  "BATTLEGROUNDS",
] as const;

async function fetchCabinetCharacters(): Promise<CabinetCharactersResponse> {
  try {
    const response = await fetch("/api/cabinet", {
      credentials: "same-origin",
    });
    if (!response.ok) {
      if (
        response.status === 401 ||
        response.status === 400 ||
        response.redirected
      )
        return { authenticated: false };
      return { authenticated: false, error: "Failed to load characters" };
    }
    const data = await response.json();
    return {
      authenticated: true,
      battletag: data.battletag,
      characters: data.characters,
    };
  } catch {
    return { authenticated: false, error: "Failed to load characters" };
  }
}

function ensureBracketFields(record: any) {
  BRACKET_FIELDS.forEach((field) => {
    if (typeof record[field] !== "number") record[field] = 0;
  });
  return record;
}

function applyBracketRatings(player: Player) {
  const copy: any = structuredClone(player);
  ensureBracketFields(copy);
  (copy.brackets || []).forEach((bracket: any) => {
    const bracketType = String(bracket.bracket_type || "");
    const rating = Number(bracket.rating || 0);
    if (bracketType.startsWith("SHUFFLE"))
      copy.SHUFFLE = Math.max(copy.SHUFFLE, rating);
    else if (bracketType.startsWith("BLITZ"))
      copy.BLITZ = Math.max(copy.BLITZ, rating);
    else copy[bracketType] = rating;
  });
  return copy;
}

function toSkeletonPlayer(character: CabinetCharacter): Player {
  const skeleton: any = {
    id: character.id || 0,
    name: character.name || "",
    level: character.level || 0,
    class: character.class || "",
    fraction: "",
    realm: character.realm || "",
    gender: character.gender || "",
    itemLevel: 0,
    lastUpdatedUTCms: 0,
    activeSpec: "",
    race: character.race || "",
    region: character.region || getRegion(),
    talents: "",
    achievements: { achievements: [], titles_history: { expansions: [] } },
    brackets: [],
  };
  return ensureBracketFields(skeleton) as Player;
}

const Cabinet = () => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "sm";
  const didAutoUpdate = useRef(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [visibilityUpdating, setVisibilityUpdating] = useState<Record<number, boolean>>({});
  const [progressCount, setProgressCount] = useState(0);
  const [updatedRecords, setUpdatedRecords] = useState<UpdatedRecords>({});
  const cabinetQuery = useQuery({
    queryKey: ["cabinet", "characters"],
    queryFn: fetchCabinetCharacters,
    staleTime: 30 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const characters = cabinetQuery.data?.characters || [];
  const battletag = cabinetQuery.data?.battletag;
  const loginHref = `/api/auth?return_url=${encodeURIComponent(
    window.location.origin + "/cabinet"
  )}`;

  const records = useMemo(() => {
    return characters
      .map((character) => {
        const charData = character.resolved || character;
        const key = `${charData.name}-${charData.realm}`;
        const hidden = Boolean((character.resolved as any)?.hidden);
        const updated = updatedRecords[key];
        if (updated) {
          const merged: any = applyBracketRatings(updated.data);
          merged.hidden = hidden;
          merged._updatedAt = updated.timestamp;
          return merged;
        }
        if (character.resolved) {
          const merged: any = applyBracketRatings(character.resolved);
          merged.hidden = hidden;
          return merged;
        }
        return toSkeletonPlayer(character);
      })
      .filter(
        (r) =>
          r.race &&
          r.race !== "Unknown" &&
          r.fraction &&
          r.fraction !== "Unknown" &&
          r.level &&
          r.level >= 70
      );
  }, [characters, updatedRecords]);

  const handleChangeVisibility = useCallback(
    async (record: any) => {
      if (!record?.id) return;
      if (visibilityUpdating[record.id]) return;
      const to = record.hidden ? "public" : "hidden";
      const region = record.region || getRegion();
      const nickname = `${record.name}-${record.realm}`;
      setVisibilityUpdating((prev) => ({ ...prev, [record.id]: true }));
      try {
        const res = await fetch(
          `/api/cabinet/changeVisibility?to=${encodeURIComponent(to)}&nickname=${encodeURIComponent(
            nickname
          )}&region=${encodeURIComponent(region)}`,
          { credentials: "same-origin" }
        );
        if (res.ok) {
          await cabinetQuery.refetch();
        } else if (res.status === 401) {
          const data = await res.json().catch(() => null);
          if (data?.redirect) {
            window.location.href = data.redirect;
          }
        } else {
          console.error("Failed to change visibility", await res.text());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setVisibilityUpdating((prev) => {
          const next = { ...prev };
          delete next[record.id];
          return next;
        });
      }
    },
    [cabinetQuery, visibilityUpdating]
  );

  const columns = useMemo(() => {
    const base = tableColumns(isMobile, updateStatus as any, true, true) as any[];
    const ratingFields = ["SHUFFLE", "BLITZ", "ARENA_2v2", "ARENA_3v3", "BATTLEGROUNDS"];
    const showRatingField = (field: string) =>
      records.some((r: any) => Number(r?.[field] || 0) > 0);
    const filteredBase = base.filter(
      (col) => !ratingFields.includes(col.field) || showRatingField(col.field)
    );
    const visibilityColumn = {
      field: "visibility",
      label: "Visibility",
      sortable: false,
      width: 140,
      render: ({ record }: any) => {
        const isHidden = Boolean(record.hidden);
        const isLoading = Boolean(visibilityUpdating[record.id]);
        const actionLabel = isHidden ? "Show" : "Hide";
        return (
          <div className="pl-2">
            <button
              type="button"
              onClick={() => handleChangeVisibility(record)}
              disabled={isLoading || isUpdating || isSyncing}
              className={[
                "group/vis inline-flex items-center justify-center box-border h-5 w-[74px] rounded-md border text-[11px] font-semibold leading-none",
                "transition-colors cursor-pointer select-none",
                "hover:ring-1 hover:ring-slate-500/40",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:ring-0",
                isHidden
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15"
                  : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15",
              ].join(" ")}
              title="Hover to change"
              aria-label={`Visibility: ${isHidden ? "hidden" : "public"} (click to ${actionLabel.toLowerCase()})`}
            >
              <span className="group-hover/vis:hidden inline-flex items-center gap-1">
                <span className="underline decoration-dotted decoration-slate-400/50 underline-offset-2">
                  {isHidden ? "Hidden" : "Public"}
                </span>
                <span className="text-slate-400/70">⇄</span>
              </span>
              <span className="hidden group-hover/vis:inline">{actionLabel}</span>
            </button>
          </div>
        );
      },
    } as any;
    const statusCol = filteredBase.find((c) => c.field === "status");
    const regionCol = filteredBase.find((c) => c.field === "region");
    const levelCol = filteredBase.find((c) => c.field === "level");
    const nameCol = filteredBase.find((c) => c.field === "name");
    const rest = filteredBase.filter((c) => !["status", "region", "level", "name"].includes(c.field));
    return [statusCol, regionCol, levelCol, nameCol, visibilityColumn, ...rest].filter(Boolean);
  }, [handleChangeVisibility, isMobile, isSyncing, isUpdating, records, updateStatus, visibilityUpdating]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout");
      if (response.ok || response.redirected) {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleUpdateAll = useCallback(async () => {
    if (isUpdating) return;
    if (!characters.length) return;
    setIsUpdating(true);
    setProgressCount(0);
    const statusMap: UpdateStatus = {};
    characters.forEach((character) => {
      const charData = character.resolved || character;
      statusMap[`${charData.name}-${charData.realm}`] = "pending";
    });
    setUpdateStatus({ ...statusMap });
    let completed = 0;
    for (const character of characters) {
      const charData = character.resolved || character;
      const key = `${charData.name}-${charData.realm}`;

      if (charData.realm === "Unknown") {
        setUpdateStatus((prev) => ({ ...prev, [key]: "error" }));
        completed++;
        setProgressCount(completed);
        continue;
      }

      try {
        const result = await getProfile(
          charData.region || getRegion(),
          charData.realm,
          charData.name,
          true
        );
        const success = result.playerStatus === 200;
        setUpdateStatus((prev) => ({
          ...prev,
          [key]: success ? "success" : "error",
        }));
        if (success) {
          setUpdatedRecords((prev) => ({
            ...prev,
            [key]: { data: result.player, timestamp: Date.now() },
          }));
        }
      } catch {
        setUpdateStatus((prev) => ({ ...prev, [key]: "error" }));
      }
      completed++;
      setProgressCount(completed);
    }
    setIsUpdating(false);
  }, [characters, isUpdating]);

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch("/api/cabinet/bnet-sync");
      if (res.ok) {
        await cabinetQuery.refetch();
      } else if (res.status === 401) {
        const data = await res.json();
        if (data.redirect) {
          window.location.href = data.redirect;
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (didAutoUpdate.current) return;
    if (!cabinetQuery.data?.needsInitialUpdate) return;
    if (!characters.length) return;
    didAutoUpdate.current = true;
    void handleUpdateAll();
  }, [
    cabinetQuery.data?.needsInitialUpdate,
    characters.length,
    handleUpdateAll,
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SEO
        title="Cabinet"
        description="Your Battle.net cabinet with your characters."
      />
      <Header />
      <main className="flex-1">
        <section className="relative mt-16 px-2 pb-4 sm:mt-20 sm:px-4 sm:pb-6 md:mt-24 md:px-6 md:pb-8 lg:px-10 lg:pb-10">
          <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-5 md:space-y-6">
            <div className="rounded-xl border border-slate-600/40 bg-gradient-to-br from-slate-900/90 to-slate-800/70 shadow-lg relative overflow-hidden">
              {isUpdating && (
                <div className="absolute top-0 left-0 w-full z-10">
                  <LinearProgress
                    variant="determinate"
                    value={(progressCount / (characters.length || 1)) * 100}
                    sx={{
                      backgroundColor: "transparent",
                      height: "3px",
                      "& .MuiLinearProgress-bar": {
                        background:
                          "linear-gradient(90deg, #3B82F6 0%, #06B6D4 100%)",
                        boxShadow: "0 0 10px 2px rgba(6, 182, 212, 0.5)",
                      },
                    }}
                  />
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-700/40">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-white">Cabinet</h1>
                  {battletag ? (
                    <span className="text-sm text-slate-300">
                      ({battletag})
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-100 text-sm font-semibold hover:bg-slate-700/60 transition-colors"
                  >
                    Logout
                  </button>
                  <Button
                    variant="contained"
                    startIcon={
                      <img
                        src={battleNetLogo}
                        alt="Battle.net"
                        className="w-5 h-5 brightness-0 invert"
                      />
                    }
                    onClick={handleSync}
                    disabled={isSyncing || isUpdating}
                    sx={{
                      color: "#fff",
                      background:
                        "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                        boxShadow: "0 4px 12px rgba(124, 58, 237, 0.4)",
                      },
                      "&:disabled": {
                        background: "rgba(148, 163, 184, 0.1)",
                        color: "rgba(148, 163, 184, 0.5)",
                        boxShadow: "none",
                      },
                      textTransform: "none",
                      borderRadius: "8px",
                      padding: "6px 16px",
                      fontSize: "0.80rem",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(124, 58, 237, 0.25)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Sync with Battle.net
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={handleUpdateAll}
                    disabled={isUpdating || !records.length}
                    sx={{
                      color: "#fff",
                      background:
                        "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
                      },
                      "&:disabled": {
                        background: "rgba(148, 163, 184, 0.1)",
                        color: "rgba(148, 163, 184, 0.5)",
                        boxShadow: "none",
                      },
                      textTransform: "none",
                      borderRadius: "8px",
                      padding: "6px 16px",
                      fontSize: "0.80rem",
                      fontWeight: 600,
                      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    Update all
                  </Button>
                </div>
              </div>
              <div className="px-2 md:px-4 py-4">
                {cabinetQuery.isLoading || isSyncing ? (
                  <AltsTable
                    columns={columns}
                    records={[]}
                    isMobile={isMobile}
                    initialSort={{ field: "name", sort: "asc" }}
                    isLoading={true}
                  />
                ) : !cabinetQuery.data?.authenticated ? (
                  <div className="py-10 text-center">
                    <div className="text-white text-lg font-semibold mb-2">
                      You are not logged in.
                    </div>
                    <a
                      href={loginHref}
                      className="inline-flex items-center px-6 py-3 rounded-lg bg-[#0074E0] hover:bg-[#0063c1] transition-all text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <img
                        src={battleNetLogo}
                        alt="Battle.net"
                        className="w-6 h-6 mr-3 object-contain brightness-0 invert"
                      />
                      Battle.net Login
                    </a>
                  </div>
                ) : records.length ? (
                  <AltsTable
                    columns={columns}
                    records={records as any}
                    isMobile={isMobile}
                    initialSort={{ field: "name", sort: "asc" }}
                  />
                ) : (
                  <div className="py-10 text-center text-slate-300">
                    No characters found on your account.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Cabinet;
