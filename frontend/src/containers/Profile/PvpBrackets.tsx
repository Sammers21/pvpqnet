import { useMemo, useState, useEffect, type CSSProperties } from "react";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import TimelineIcon from "@mui/icons-material/Timeline";
import CloseIcon from "@mui/icons-material/Close";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  getSpecIcon,
  getWonAndLossColors,
  bracketToColor,
  getSeasonRankImageFromRating,
} from "@/utils/table";
import {
  CLASS_AND_SPECS,
  SEARCH_PARAM_TO_SPEC,
} from "@/constants/filterSchema";
import type { Bracket, Player } from "@/types";
import { getCurrentSeason, type WowSeason } from "@/constants/seasons";
import SeasonSelector from "./SeasonSelector";
import { fetchBracketActivity } from "@/services/stats.service";
import { REGION } from "@/constants/region";
import {
  SHUFFLE_CUTOFF_PREFIX,
  BLITZ_CUTOFF_PREFIX,
  ARENA_CUTOFF_KEY,
} from "@/constants/cutoffs";
import moment from "moment-timezone";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

interface IProps {
  player: Player;
  selectedSeason: WowSeason;
  onSeasonChange: (season: WowSeason) => void;
}

type SpotCounts = Record<string, number | undefined>;

// Helper to calculate percentile
const calculatePercentile = (
  rank: number,
  bracketType: string,
  spec: string,
  playerClass: string,
  spotCounts: SpotCounts
): { percentile: number; text: string } | null => {
  if (!rank || rank <= 0) return null;

  let spotKey = "";
  const cleanSpec = spec.toLowerCase().replace(/\s/g, "");
  const cleanClass = playerClass.toLowerCase().replace(/\s/g, "");
  const specKey = `${cleanSpec}${cleanClass}`;
  // @ts-ignore
  const specCode = SEARCH_PARAM_TO_SPEC[specKey];

  if (bracketType.includes("SHUFFLE") && specCode) {
    spotKey = `${SHUFFLE_CUTOFF_PREFIX}${specCode}`;
  } else if (bracketType.includes("BLITZ") && specCode) {
    spotKey = `${BLITZ_CUTOFF_PREFIX}${specCode}`;
  } else if (bracketType.includes("3v3")) {
    spotKey = ARENA_CUTOFF_KEY;
  }

  const spotCount = spotCounts[spotKey];

  if (!spotCount || spotCount === 0) return null;

  // spotCount = R1 spots = 0.1% of ladder
  // So estimated ladder size = spotCount * 1000
  const estimatedLadderSize = spotCount * 1000;
  const percentile = (rank / estimatedLadderSize) * 100;

  let text = "";
  if (percentile < 0.01) {
    text = "<0.01%";
  } else if (percentile < 0.1) {
    text = `${percentile.toFixed(3)}%`;
  } else if (percentile < 1) {
    text = `${percentile.toFixed(2)}%`;
  } else if (percentile < 10) {
    text = `${percentile.toFixed(1)}%`;
  } else {
    text = `${Math.round(percentile)}%`;
  }

  return { percentile, text };
};

// Helper to get rating from history entry (server-provided or calculated)
// Helper to get rating from history entry (server-provided)
const getEntryRating = (entry: any, fallback: number): number => {
  // Server provides rating in character.rating (same as History display uses)
  return entry.character?.rating ?? entry.rating ?? fallback;
};
// Helper to get rank from history entry (server-provided)
const getEntryRank = (entry: any, fallback: number): number => {
  // Server provides rank in character.pos (same as History display uses)
  return entry.character?.pos ?? entry.rank ?? fallback;
};
// Compute bracket stats for a past season from gaming history
const computeSeasonBracket = (
  bracket: Bracket,
  season: WowSeason
): Bracket | null => {
  const rawHistory = bracket?.gaming_history?.history || [];
  if (rawHistory.length === 0) return null;
  // Add 2-day buffer after season end to catch final rating updates
  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const seasonStartTime = new Date(season.startDate).getTime();
  const seasonEndTime = season.endDate
    ? new Date(season.endDate).getTime() + TWO_DAYS_MS
    : Date.now();
  // Filter and sort history entries within the season chronologically
  const seasonHistory = rawHistory
    .filter((entry) => {
      const t = entry.diff.timestamp;
      return t >= seasonStartTime && t <= seasonEndTime;
    })
    .sort((a, b) => a.diff.timestamp - b.diff.timestamp);
  if (seasonHistory.length === 0) return null;
  // Calculate total wins/losses for the season
  let totalWon = 0;
  let totalLost = 0;
  seasonHistory.forEach((entry) => {
    totalWon += entry.diff.won;
    totalLost += entry.diff.lost;
  });
  // End-of-season stats from the LAST entry in the season
  // Use server-provided rating/rank from character fields (matches History display)
  const lastEntry = seasonHistory[seasonHistory.length - 1];
  const endOfSeasonRating = getEntryRating(lastEntry, 0);
  const endOfSeasonRank = getEntryRank(lastEntry, -1);
  // Find max rating achieved during the season
  let maxRatingInSeason = endOfSeasonRating;
  let maxRatingTimestamp = lastEntry.diff.timestamp;
  seasonHistory.forEach((entry) => {
    const entryRating = getEntryRating(entry, 0);
    if (entryRating > maxRatingInSeason) {
      maxRatingInSeason = entryRating;
      maxRatingTimestamp = entry.diff.timestamp;
    }
  });
  return {
    ...bracket,
    rating: endOfSeasonRating,
    won: totalWon,
    lost: totalLost,
    rank: endOfSeasonRank,
    season_max_rating: maxRatingInSeason,
    season_max_rating_achieved_timestamp: maxRatingTimestamp,
    max_rating: bracket.max_rating,
    max_rating_achieved_timestamp: bracket.max_rating_achieved_timestamp,
    gaming_history: { history: seasonHistory },
  };
};

const arenaAndRbg = [
  { name: "ARENA_2v2", title: "2v2" },
  { name: "ARENA_3v3", title: "3v3" },
  { name: "BATTLEGROUNDS", title: "RBG" },
];

// Bracket History Modal Component with Rating Chart
const BracketHistoryModal = ({
  open,
  onClose,
  bracket,
  title,
  seasonName,
  region,
}: {
  open: boolean;
  onClose: () => void;
  bracket?: Bracket;
  title: string;
  seasonName: string;
  region: string;
}) => {
  const history = bracket?.gaming_history?.history || [];
  // Sort chronologically (oldest first) for the chart
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => a.diff.timestamp - b.diff.timestamp);
  }, [history]);
  const chartData = useMemo(() => {
    const tz = region === "eu" ? "Europe/Paris" : "America/Chicago";
    const labels = sortedHistory.map((entry) =>
      moment
        .unix(entry.diff.timestamp / 1000)
        .utc()
        .tz(tz)
        .format("MMM DD")
    );
    const ratings = sortedHistory.map(
      (entry) => entry.character?.rating ?? entry.rating ?? 0
    );
    return {
      labels,
      datasets: [
        {
          label: "Rating",
          data: ratings,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.1)",
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#38bdf8",
          pointBorderColor: "#0a0f18",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [sortedHistory, region]);
  const chartOptions = useMemo(() => {
    const ratings = sortedHistory.map(
      (entry) => entry.character?.rating ?? entry.rating ?? 0
    );
    const minRating = Math.min(...ratings);
    const maxRating = Math.max(...ratings);
    const padding = Math.max(50, Math.round((maxRating - minRating) * 0.1));
    return {
      animation: {
        duration: 0,
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index" as const,
        intersect: false,
      },
      plugins: {
        filler: false as any,
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e293b",
          titleColor: "#e2e8f0",
          bodyColor: "#94a3b8",
          borderColor: "#334155",
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: (items: any) => {
              const idx = items[0]?.dataIndex;
              if (idx === undefined) return "";
              const entry = sortedHistory[idx];
              const tz = region === "eu" ? "Europe/Paris" : "America/Chicago";
              return moment
                .unix(entry.diff.timestamp / 1000)
                .utc()
                .tz(tz)
                .format("MMM DD, YYYY - hh:mm A");
            },
            label: (context: any) => {
              const idx = context.dataIndex;
              const entry = sortedHistory[idx];
              const rating = entry.character?.rating ?? entry.rating ?? 0;
              const diff = entry.diff.rating_diff;
              const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
              return `Rating: ${rating} (${diffStr})`;
            },
            afterLabel: (context: any) => {
              const idx = context.dataIndex;
              const entry = sortedHistory[idx];
              const rank = entry.character?.pos ?? entry.rank ?? 0;
              const won = entry.diff.won;
              const lost = entry.diff.lost;
              return [`Rank: #${rank}`, `W/L: ${won}/${lost}`];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(55, 65, 81, 0.3)" },
          ticks: { color: "#9ca3af", maxRotation: 45, minRotation: 45 },
        },
        y: {
          min: Math.max(0, minRating - padding),
          max: maxRating + padding,
          grid: { color: "rgba(55, 65, 81, 0.3)" },
          ticks: { color: "#9ca3af" },
        },
      },
    };
  }, [sortedHistory, region]);
  // Calculate stats
  const stats = useMemo(() => {
    if (sortedHistory.length === 0) return null;
    const ratings = sortedHistory.map(
      (entry) => entry.character?.rating ?? entry.rating ?? 0
    );
    const first = ratings[0];
    const last = ratings[ratings.length - 1];
    const peak = Math.max(...ratings);
    const totalWon = sortedHistory.reduce((sum, e) => sum + e.diff.won, 0);
    const totalLost = sortedHistory.reduce((sum, e) => sum + e.diff.lost, 0);
    return { first, last, peak, change: last - first, totalWon, totalLost };
  }, [sortedHistory]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#0a0f18",
          backgroundImage: "linear-gradient(to bottom right, #0a0f18, #030303)",
          border: "1px solid #37415180",
          borderRadius: "12px",
          maxHeight: "85vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #37415140",
          pb: 2,
        }}
      >
        <div className="flex items-center gap-3">
          <TimelineIcon className="!w-6 !h-6 text-sky-400" />
          <span className="text-xl font-bold text-white">{title}</span>
          <span className="text-sm text-slate-400">({seasonName})</span>
        </div>
        <IconButton onClick={onClose} sx={{ color: "#9ca3af" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {sortedHistory.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            No history available for this season
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Stats Summary */}
            {stats && (
              <div className="flex flex-wrap gap-3 justify-center">
                <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400">Start</div>
                  <div className="text-lg font-bold text-white">
                    {stats.first}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400">End</div>
                  <div className="text-lg font-bold text-white">
                    {stats.last}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400">Peak</div>
                  <div className="text-lg font-bold text-orange-400">
                    {stats.peak}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400">Change</div>
                  <div
                    className={`text-lg font-bold ${stats.change >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                  >
                    {stats.change >= 0 ? "+" : ""}
                    {stats.change}
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <div className="text-xs text-slate-400">Games</div>
                  <div className="text-lg font-bold">
                    <span className="text-emerald-400">{stats.totalWon}</span>
                    <span className="text-slate-500 mx-1">/</span>
                    <span className="text-red-400">{stats.totalLost}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Chart */}
            <div className="h-[350px] w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const PvpBracket = ({
  title,
  bracket,
  isZolo,
  zoloName,
  playerClass,
  hasFourSpecs,
  spotCounts,
  isHistorical,
  seasonName,
  region,
}: {
  title?: string;
  bracket?: Bracket;
  isZolo?: boolean;
  zoloName?: string;
  playerClass?: string;
  hasFourSpecs: boolean;
  spotCounts: SpotCounts;
  isHistorical?: boolean;
  seasonName?: string;
  region?: string;
}) => {
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const hasHistory = (bracket?.gaming_history?.history?.length ?? 0) > 0;
  const specIcon = useMemo(() => {
    if (!isZolo || !title) return;
    return getSpecIcon(`${title} ${playerClass}` || "");
  }, [title, isZolo, playerClass]);

  const ratingColor = useMemo(() => {
    if (!bracket) return "#ffffff";
    return bracketToColor(bracket);
  }, [bracket]);

  const stats = useMemo(() => {
    const won = bracket?.won || 0;
    const lost = bracket?.lost || 0;
    const rating = bracket?.rating || 0;
    const is_rank_one_range = bracket?.is_rank_one_range || false;
    const { wonColor, lossColor } = getWonAndLossColors(won, lost);
    const showWinRate = won > 0 || lost > 0;
    const winRate = ((won * 100) / (won + lost)).toFixed(2);
    const totalGames = won + lost;
    // Skip percentile for historical data (not accurate for past seasons)
    const percentileData =
      !isHistorical && bracket?.rank
        ? calculatePercentile(
          bracket.rank,
          bracket.bracket_type ||
          (isZolo
            ? zoloName === "Shuffle"
              ? "SHUFFLE"
              : "BLITZ"
            : "ARENA"),
          title || "",
          playerClass || "",
          spotCounts
        )
        : null;
    return {
      rating,
      is_rank_one_range,
      showWinRate,
      wonColor,
      lossColor,
      winRate,
      totalGames,
      percentileData,
    };
  }, [bracket, isZolo, zoloName, title, playerClass, spotCounts, isHistorical]);

  const ratingImg = (
    <img
      className="w-12 h-12 drop-shadow-lg mr-2"
      src={getSeasonRankImageFromRating(stats.rating, stats.is_rank_one_range)}
      alt="rating"
    />
  );

  const winRateNum = parseInt(stats.winRate, 10);
  const winRateColorClass =
    winRateNum >= 55
      ? "text-emerald-400"
      : winRateNum >= 50
        ? "text-yellow-400"
        : "text-red-400";

  const hasSeasonMax =
    bracket?.season_max_rating && bracket.season_max_rating !== -1;
  const hasAllTimeMax = bracket?.max_rating && bracket.max_rating !== -1;
  const hasRank = bracket?.rank && bracket.rank !== -1;

  // If season max equals all-time max, only show one as "Record"
  const seasonEqualsAllTime =
    hasSeasonMax &&
    hasAllTimeMax &&
    bracket.season_max_rating === bracket.max_rating;

  return (
    <div
      className={`flex self-stretch flex-col pr-2 pb-2 w-full min-[450px]:w-1/2 sm:w-1/2 md:w-1/3 ${hasFourSpecs ? "lg:w-1/4" : "lg:w-1/3"
        }`}
    >
      <div className="group relative flex flex-col w-full h-full rounded-xl border border-slate-600/40 bg-gradient-to-br from-slate-900/95 via-slate-800/80 to-slate-900/95 shadow-lg hover:border-sky-500/30 transition-all duration-300 p-3">
        {/* History Icon - appears on hover */}
        {hasHistory && (
          <button
            onClick={() => setHistoryModalOpen(true)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800/80 border border-slate-600/50 opacity-0 group-hover:opacity-100 hover:bg-sky-500/20 hover:border-sky-500/50 transition-all duration-200 z-10"
            title="View history"
          >
            <TimelineIcon className="!w-4 !h-4 text-sky-400" />
          </button >
        )}
        {/* Header: Title & Icon */}
        <div className="flex items-center justify-center gap-2 mb-1 min-h-[32px]">
          {specIcon && (
            <img
              className={`${isZolo ? "h-8 w-8" : "h-5 w-5"
                } rounded border border-slate-600/50 shadow-sm`}
              src={specIcon}
              alt={title}
            />
          )}
          <span className="text-base font-bold text-white tracking-wide truncate">
            {isZolo ? `${title}` : title}
          </span>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center justify-center flex-1">
          {/* Rating & Icon */}
          <div className="flex items-center justify-center mb-1">
            {ratingImg}
            <div
              className="text-4xl font-bold tracking-tight"
              style={{
                color: ratingColor,
                textShadow: `0 0 15px ${ratingColor}30`,
              }}
            >
              {stats.rating}
            </div>
          </div>

          {/* Rank & Percentile */}
          <div className="flex items-center justify-center mb-3 w-full px-4">
            {hasRank ? (
              <div
                className={`flex items-center ${stats.percentileData ? "justify-between" : "justify-center"
                  } w-full bg-slate-800/40 rounded-lg px-2.5 py-1 border border-slate-700/50`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                    Rank
                  </span>
                  <span className="text-white text-lg font-bold tracking-tight">
                    #{bracket?.rank}
                  </span>
                </div>
                {stats.percentileData && (
                  <div className="flex items-center gap-1 bg-slate-700/40 px-1.5 py-0.5 rounded border border-slate-600/30">
                    <span className="text-sky-300 text-xs font-semibold">
                      {stats.percentileData.text}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full text-center py-1">
                <span className="text-slate-600 text-xs italic">Unranked</span>
              </div>
            )}
          </div>

          {/* Compact Stats Grid */}
          <div className="flex flex-col w-full px-2 mb-3 mt-auto">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-emerald-400">
                  {bracket?.won || 0}W
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-semibold text-red-400">
                  {bracket?.lost || 0}L
                </span>
              </div>
              <span
                className={`text-sm font-semibold ${winRateColorClass}`}
                style={{ opacity: stats.showWinRate ? 1 : 0.3 }}
              >
                {stats.showWinRate ? `${stats.winRate}%` : "—"}
              </span>
            </div>
            {/* Progress Bar */}
            <div className="relative h-1.5 w-full rounded-full overflow-hidden bg-red-500/30">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${stats.showWinRate ? stats.winRate : 50}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
            </div>
          </div>
        </div>

        {/* Footer: Records - Very Compact */}
        <div className="border-t border-slate-700/40 pt-2 flex flex-col gap-1">
          {seasonEqualsAllTime ? (
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-1 text-orange-400/90">
                <span className="font-medium">Record</span>
                <InfoOutlinedIcon className="!w-3 !h-3 opacity-60" />
              </div>
              <span className="text-orange-300 font-bold">
                {bracket?.max_rating || stats.rating}
              </span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Season High</span>
                <span className="text-slate-300 font-medium">
                  {bracket?.season_max_rating || stats.rating}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <span>Record</span>
                  <InfoOutlinedIcon className="!w-3 !h-3 opacity-60" />
                </div>
                <span className="text-slate-300 font-medium">
                  {bracket?.max_rating || stats.rating}
                </span>
              </div>
            </>
          )}
        </div>
      </div >
      {/* History Modal */}
      < BracketHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        bracket={bracket}
        title={isZolo ? `${title} ${zoloName}` : title || ""}
        seasonName={seasonName || ""}
        region={region || "eu"}
      />
    </div >
  );
};

const PvpBrackets = ({ player, selectedSeason, onSeasonChange }: IProps) => {
  const isCurrentSeason = selectedSeason.id === getCurrentSeason().id;
  const [spotCounts, setSpotCounts] = useState<SpotCounts>({});

  // Fetch stats for spot counts
  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchBracketActivity(player.region as REGION);
        const counts = data?.cutoffs?.spotWithNoAlts ?? {};
        setSpotCounts(counts);
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    loadStats();
  }, [player.region]);

  // Helper to get bracket data (current or computed for past season)
  const getBracketForSeason = (
    bracket: Bracket | undefined
  ): Bracket | undefined => {
    if (!bracket) return undefined;
    if (isCurrentSeason) return bracket;
    const computed = computeSeasonBracket(bracket, selectedSeason);
    return computed || undefined;
  };
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[player.class] as string[];
  const hasFourSpecs = classAndSpec.length === 4;
  const shuffleBrackets = classAndSpec
    .map((spec) => {
      const rawBracket = player?.brackets?.find(
        ({ bracket_type }) =>
          bracket_type.includes(spec) && bracket_type.includes("SHUFFLE")
      );
      const bracket = getBracketForSeason(rawBracket);
      const noRender =
        player.class === "Druid" && spec === "Guardian" && !bracket;
      return { bracket, spec, noRender };
    })
    .sort((a, b) => (b.bracket?.rating ?? 0) - (a.bracket?.rating ?? 0));
  const blitzBrackets = classAndSpec
    .map((spec) => {
      const rawBracket = player?.brackets?.find(
        ({ bracket_type }) =>
          bracket_type.includes(spec) && bracket_type.includes("BLITZ")
      );
      const bracket = getBracketForSeason(rawBracket);
      const noRender =
        player.class === "Druid" && spec === "Guardian" && !bracket;
      return { bracket, spec, noRender };
    })
    .sort((a, b) => (b.bracket?.rating ?? 0) - (a.bracket?.rating ?? 0));
  const hasDruidTank =
    player.class === "Druid" &&
    !!(player?.brackets || []).find((b) => b.bracket_type.includes("Guardian"));
  // Check if player has any shuffle or blitz brackets with rating > 0 or any games played
  const hasAnyShuffle = shuffleBrackets.some(
    ({ bracket, noRender }) =>
      !noRender &&
      bracket &&
      (bracket.rating > 0 || bracket.won > 0 || bracket.lost > 0)
  );
  const hasAnyBlitz = blitzBrackets.some(
    ({ bracket, noRender }) =>
      !noRender &&
      bracket &&
      (bracket.rating > 0 || bracket.won > 0 || bracket.lost > 0)
  );

  const arenaCascade = { "--profile-anim-delay": "140ms" } as CSSProperties;
  const shuffleCascade = { "--profile-anim-delay": "220ms" } as CSSProperties;
  const blitzCascade = { "--profile-anim-delay": "300ms" } as CSSProperties;

  return (
    <div className="flex gap-3 justify-start flex-col">
      {/* Traditional Brackets Container */}
      <div className="border border-solid border-slate-600/40 rounded-xl p-3 bg-gradient-to-br from-slate-900/90 to-slate-800/70">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-600/30">
          <span className="text-lg font-semibold text-white">Arena & RBG</span>
          <div className="flex items-center gap-2">
            {!isCurrentSeason && (
              <span className="text-xs text-amber-400/80 px-2 py-1 rounded bg-amber-500/10 border border-amber-400/20">
                Historical
              </span>
            )}
            <SeasonSelector
              selectedSeason={selectedSeason}
              onSeasonChange={onSeasonChange}
              player={player}
            />
          </div>
        </div>
        <div
          className="flex flex-wrap flex-row items-stretch justify-start profile-animate-cascade"
          style={arenaCascade}
        >
          {arenaAndRbg.map(({ title, name }) => {
            const rawBracket = (player?.brackets || []).find(
              (b) => b.bracket_type === name
            );
            const bracket = getBracketForSeason(rawBracket);
            return (
              <PvpBracket
                key={name}
                title={title}
                bracket={bracket}
                hasFourSpecs={false}
                spotCounts={spotCounts}
                isHistorical={!isCurrentSeason}
                seasonName={selectedSeason.shortName}
                region={player.region}
              />
            );
          })}
        </div>
      </div>

      {/* Shuffle Brackets - only show if player has any */}
      {hasAnyShuffle && (
        <div className="border border-solid border-slate-600/40 rounded-xl p-3 bg-gradient-to-br from-slate-900/90 to-slate-800/70">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-600/30">
            <span className="text-lg font-semibold text-white">
              Solo Shuffle
            </span>
          </div>
          <div
            className="flex flex-wrap justify-start profile-animate-cascade"
            style={shuffleCascade}
          >
            {shuffleBrackets.map(({ bracket, spec, noRender }) => {
              if (noRender) return null;
              return (
                <PvpBracket
                  key={spec}
                  bracket={bracket}
                  title={spec}
                  isZolo={true}
                  zoloName={"Shuffle"}
                  playerClass={player.class}
                  hasFourSpecs={hasFourSpecs && hasDruidTank}
                  spotCounts={spotCounts}
                  isHistorical={!isCurrentSeason}
                  seasonName={selectedSeason.shortName}
                  region={player.region}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Blitz Brackets - only show if player has any */}
      {hasAnyBlitz && (
        <div className="border border-solid border-slate-600/40 rounded-xl p-3 bg-gradient-to-br from-slate-900/90 to-slate-800/70">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-600/30">
            <span className="text-lg font-semibold text-white">
              Battleground Blitz
            </span>
          </div>
          <div
            className="flex flex-wrap justify-start profile-animate-cascade"
            style={blitzCascade}
          >
            {blitzBrackets.map(({ bracket, spec, noRender }) => {
              if (noRender) return null;
              return (
                <PvpBracket
                  key={spec}
                  bracket={bracket}
                  title={spec}
                  isZolo={true}
                  zoloName={"Blitz"}
                  playerClass={player.class}
                  hasFourSpecs={hasFourSpecs && hasDruidTank}
                  spotCounts={spotCounts}
                  isHistorical={!isCurrentSeason}
                  seasonName={selectedSeason.shortName}
                  region={player.region}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PvpBrackets;
