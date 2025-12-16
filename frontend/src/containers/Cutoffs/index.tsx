import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import BlizzardLoader from "@/components/BlizzardLoader";
import { REGION } from "@/constants/region";
import { fetchBracketActivity } from "@/services/stats.service";
import { getRegion } from "@/utils/urlparts";
import { getSpecIcon } from "@/utils/table";
import {
  SEARCH_PARAM_TO_FULL_SPEC,
  SEARCH_PARAM_TO_SPEC,
} from "@/constants/filterSchema";
import {
  ARENA_CUTOFF_KEY,
  BATTLEGROUND_ALLIANCE_KEY,
  BATTLEGROUND_HORDE_KEY,
  BLITZ_CUTOFF_PREFIX,
  CUT_OFF_SEASON_NAME,
  CUT_OFF_TITLES,
  SHUFFLE_CUTOFF_PREFIX,
} from "@/constants/cutoffs";

type CutoffEntry = {
  rating?: number;
  predicted?: number;
  totalSpots?: number;
  uniqueSpots?: number;
  population?: number;
};

const specNameMap = SEARCH_PARAM_TO_FULL_SPEC as Record<string, string>;
const specCodeMap = SEARCH_PARAM_TO_SPEC as Record<string, string>;
type SpecCutoffRow = {
  id: string;
  name: string;
  entry: CutoffEntry;
  icon: string;
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString();
};
const SIGNED_DELTA_FORMATTER = new Intl.NumberFormat("en-US", {
  signDisplay: "always",
  maximumFractionDigits: 1,
});
const formatSignedDelta = (value: number) => SIGNED_DELTA_FORMATTER.format(value);
const getPredictionDelta = (predicted?: number, rating?: number) => {
  if (predicted === undefined || predicted === null) return null;
  if (rating === undefined || rating === null) return null;
  const delta = predicted - rating;
  return { delta, isMatch: delta === 0 };
};
const PredictedCutoffCell = ({
  predicted,
  rating,
}: {
  predicted?: number;
  rating?: number;
}) => {
  const comparison = getPredictionDelta(predicted, rating);
  const valueClass = comparison
    ? comparison.isMatch
      ? "text-slate-300"
      : "text-amber-200"
    : "text-slate-300";
  return (
    <div className="flex items-center gap-2">
      <span className={valueClass}>{formatNumber(predicted)}</span>
      {comparison &&
        (comparison.isMatch ? (
          <span
            className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/20"
            title="Prediction matches official cutoff"
          >
            ✓
          </span>
        ) : (
          <span
            className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/20"
            title={`Prediction differs from official cutoff by ${formatSignedDelta(
              comparison.delta
            )}`}
          >
            Δ{formatSignedDelta(comparison.delta)}
          </span>
        ))}
    </div>
  );
};

const getRatingColor = (rating?: number) => {
  if (!rating) return "text-slate-400";
  if (rating >= 2400) return "text-amber-400";
  if (rating >= 2100) return "text-purple-400";
  if (rating >= 1800) return "text-blue-400";
  if (rating >= 1600) return "text-emerald-400";
  return "text-slate-300";
};

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString();
};

type SummaryCardData = {
  title: string;
  subtitle: string;
  description?: string;
  entry: CutoffEntry;
  showPredicted?: boolean;
};

interface SummaryCardProps {
  title: string;
  subtitle: string;
  description?: string;
  entry: CutoffEntry;
  showPredicted?: boolean;
}

const formatPopulationDisplay = (population?: number) =>
  population !== undefined
    ? `~${Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(population)} players`
    : "—";

const PopulationCard = ({
  label,
  population,
  rank,
}: {
  label: string;
  population?: number;
  rank?: number;
}) => {
  const formattedValue = formatPopulationDisplay(population);
  const isTopRank = rank === 1;
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border px-6 py-5 backdrop-blur transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] ${isTopRank
        ? "border-amber-400/50 bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent shadow-[0_25px_70px_-30px_rgba(251,191,36,0.6)] hover:border-amber-300/70 hover:shadow-[0_45px_100px_-40px_rgba(245,158,11,0.8)]"
        : "border-amber-400/25 bg-amber-500/5 shadow-[0_25px_70px_-45px_rgba(251,191,36,0.45)] hover:border-amber-200/60 hover:shadow-[0_45px_100px_-50px_rgba(245,158,11,0.65)]"
        }`}
    >
      {isTopRank && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/20 blur-2xl transition-all duration-500 group-hover:bg-amber-300/30"></div>
      )}
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-amber-200/80">
        <span className="flex items-center gap-2">
          {isTopRank && <span className="text-amber-400">👑</span>}
          {label}
        </span>
        {rank !== undefined && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isTopRank
              ? "bg-amber-400/20 text-amber-300"
              : "bg-slate-800/60 text-amber-300/80"
              }`}
          >
            #{rank}
          </span>
        )}
      </div>
      <div
        className={`mt-3 text-3xl font-bold tracking-tight transition-colors duration-300 ${isTopRank ? "text-amber-50" : "text-white group-hover:text-amber-50"
          }`}
      >
        {formattedValue}
      </div>
    </div>
  );
};
type MetricDefinition = {
  label: string;
  value: string;
  wrapper: string;
  labelClass: string;
  labelSizeClass?: string;
  extraClass?: string;
  valueClass?: string;
  tileClass?: string;
};

const buildStandardMetrics = (
  entry: CutoffEntry,
  options?: { includePredicted?: boolean }
) => {
  const includePredicted = options?.includePredicted ?? true;
  const metrics: MetricDefinition[] = [
    {
      label: "Official Cutoff",
      value: formatNumber(entry.rating),
      wrapper: "border border-sky-500/20 bg-slate-900/70",
      labelClass: "text-sky-400/80",
      labelSizeClass: includePredicted ? undefined : "text-xs sm:text-sm",
      extraClass: includePredicted ? undefined : "sm:col-span-2",
      valueClass: includePredicted
        ? undefined
        : "text-4xl sm:text-5xl tracking-tight",
      tileClass: includePredicted
        ? undefined
        : "bg-gradient-to-r from-slate-900/95 via-slate-900/75 to-slate-900/95 sm:flex sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-5 border border-sky-500/40 shadow-[0_25px_80px_-45px_rgba(14,165,233,0.85)]",
    },
  ];
  if (includePredicted) {
    metrics.push({
      label: "PvPq.net Predicted Cutoff",
      value: formatNumber(entry.predicted),
      wrapper: "border border-sky-500/20 bg-slate-900/70",
      labelClass: "text-sky-400/80",
    });
  }
  metrics.push(
    {
      label: "Total Spots",
      value: formatNumber(entry.totalSpots),
      wrapper: "border border-sky-500/12 bg-slate-900/60",
      labelClass: "text-sky-200/70",
    },
    {
      label: "Unique Spots",
      value: formatNumber(entry.uniqueSpots),
      wrapper: "border border-sky-500/12 bg-slate-900/60",
      labelClass: "text-sky-200/70",
    }
  );
  return metrics;
};

const SummaryCard = ({
  title,
  subtitle,
  description,
  entry,
  showPredicted = true,
}: SummaryCardProps) => {
  const metrics = buildStandardMetrics(entry, {
    includePredicted: showPredicted,
  });
  const ratingColor = getRatingColor(entry.rating);
  const isArena = subtitle.includes("Arena");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-950/90 to-slate-900/60 shadow-[0_35px_70px_-45px_rgba(15,23,42,0.9)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_55px_110px_-60px_rgba(56,189,248,0.45)]">
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-500/5 blur-3xl transition-all duration-500 group-hover:bg-sky-500/10"></div>
      {/* Header Section */}
      <div className="relative border-b border-slate-800/70 px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              {isArena ? (
                <svg
                  className="h-5 w-5 text-sky-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2L3 7l7 5 7-5-7-5zM3 12l7 5 7-5-7-5-7 5z" />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-sky-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {subtitle} Cutoff
              </h2>
              {description && (
                <p className="text-sm text-slate-400">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5">
            <span className="text-sky-400">🏆</span>
            <span className="text-sm font-medium text-sky-200">{title}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="relative p-6">
        <div className="grid gap-3 text-sm text-slate-200/90 sm:grid-cols-2">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={`relative overflow-hidden rounded-xl px-4 py-3 transition-all duration-300 hover:-translate-y-0.5 ${metric.wrapper
                } ${metric.extraClass ?? ""} ${metric.tileClass ?? ""} ${index === 0
                  ? "border-sky-500/30 bg-gradient-to-r from-sky-500/10 to-transparent"
                  : ""
                }`}
            >
              <div
                className={`${metric.labelSizeClass ?? "text-[10px]"
                  } uppercase tracking-[0.18em] ${metric.labelClass}`}
              >
                {metric.label}
              </div>
              <div
                className={`mt-1 font-bold ${metric.valueClass ?? "text-lg"} ${index === 0 ? ratingColor : "text-white"
                  }`}
              >
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Cutoffs = () => {
  const params = useParams();
  const normalizedRegion = getRegion(params.region) as REGION;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoading(true);
      const data = await fetchBracketActivity(normalizedRegion);
      if (!isActive) return;
      setStats(data);
      setLoading(false);
    };
    load();
    return () => {
      isActive = false;
    };
  }, [normalizedRegion]);
  const cutoffs = stats?.cutoffs ?? {};
  const rewards: Record<string, number | undefined> = cutoffs.rewards ?? {};
  const predictions: Record<string, number | undefined> =
    cutoffs.predictions ?? {};
  const spotCounts: Record<string, number | undefined> =
    cutoffs.spotCounts ?? {};
  const uniqueSpots: Record<string, number | undefined> =
    cutoffs.spotWithNoAlts ?? {};
  const timestamp = formatTimestamp(cutoffs.timestamp);
  const seasonName = cutoffs.season ?? CUT_OFF_SEASON_NAME;
  const hasEntryData = (entry: CutoffEntry) => {
    return (
      entry.rating !== undefined ||
      entry.predicted !== undefined ||
      entry.totalSpots !== undefined ||
      entry.uniqueSpots !== undefined
    );
  };
  const summaryCards = useMemo(() => {
    const items: SummaryCardData[] = [];
    const arenaEntry: CutoffEntry = {
      rating: rewards[ARENA_CUTOFF_KEY],
      predicted: predictions[ARENA_CUTOFF_KEY],
      totalSpots: spotCounts[ARENA_CUTOFF_KEY],
      uniqueSpots: uniqueSpots[ARENA_CUTOFF_KEY],
    };
    const hasArenaPrediction =
      arenaEntry.predicted !== undefined && arenaEntry.predicted !== null;
    items.push({
      title: CUT_OFF_TITLES.arena3v3,
      subtitle: "Arena 3v3",
      description: "Team rating thresholds",
      entry: arenaEntry,
      showPredicted: hasArenaPrediction,
    });

    const battlegroundEntry: CutoffEntry = {
      rating:
        rewards[BATTLEGROUND_ALLIANCE_KEY] ?? rewards[BATTLEGROUND_HORDE_KEY],
      predicted:
        predictions[BATTLEGROUND_ALLIANCE_KEY] ??
        predictions[BATTLEGROUND_HORDE_KEY],
      totalSpots:
        spotCounts[BATTLEGROUND_ALLIANCE_KEY] ??
        spotCounts[BATTLEGROUND_HORDE_KEY],
      uniqueSpots:
        uniqueSpots[BATTLEGROUND_ALLIANCE_KEY] ??
        uniqueSpots[BATTLEGROUND_HORDE_KEY],
    };

    if (hasEntryData(battlegroundEntry)) {
      const hasBattlegroundPrediction =
        battlegroundEntry.predicted !== undefined &&
        battlegroundEntry.predicted !== null;
      items.push({
        title: CUT_OFF_TITLES.battleground,
        subtitle: "Rated Battlegrounds",
        description: "Team battleground thresholds",
        entry: battlegroundEntry,
        showPredicted: hasBattlegroundPrediction,
      });
    }

    return items;
  }, [rewards, predictions, spotCounts, uniqueSpots]);
  const shuffleRows = useMemo(() => {
    return Object.keys(specNameMap)
      .map<SpecCutoffRow | null>((specKey) => {
        const specCode = specCodeMap[specKey];
        const shuffleKey = `${SHUFFLE_CUTOFF_PREFIX}${specCode}`;
        const entry = {
          rating: rewards[shuffleKey],
          predicted: predictions[shuffleKey],
          totalSpots: spotCounts[shuffleKey],
          uniqueSpots: uniqueSpots[shuffleKey],
        };
        if (!hasEntryData(entry)) return null;
        return {
          id: specKey,
          name: specNameMap[specKey],
          entry,
          icon: getSpecIcon(specKey),
        };
      })
      .filter(Boolean) as SpecCutoffRow[];
  }, [rewards, predictions, spotCounts, uniqueSpots]);
  const blitzRows = useMemo(() => {
    return Object.keys(specNameMap)
      .map<SpecCutoffRow | null>((specKey) => {
        const specCode = specCodeMap[specKey];
        const blitzKey = `${BLITZ_CUTOFF_PREFIX}${specCode}`;
        const entry = {
          rating: rewards[blitzKey],
          predicted: predictions[blitzKey],
          totalSpots: spotCounts[blitzKey],
          uniqueSpots: uniqueSpots[blitzKey],
        };
        if (!hasEntryData(entry)) return null;
        return {
          id: specKey,
          name: specNameMap[specKey],
          entry,
          icon: getSpecIcon(specKey),
        };
      })
      .filter(Boolean) as SpecCutoffRow[];
  }, [rewards, predictions, spotCounts, uniqueSpots]);
  const hasShufflePredictions = shuffleRows.some(
    (row) => row.entry.predicted !== undefined && row.entry.predicted !== null
  );
  const hasBlitzPredictions = blitzRows.some(
    (row) => row.entry.predicted !== undefined && row.entry.predicted !== null
  );
  const arenaUnique = uniqueSpots[ARENA_CUTOFF_KEY];
  const battlegroundUnique =
    uniqueSpots[BATTLEGROUND_ALLIANCE_KEY] ??
    uniqueSpots[BATTLEGROUND_HORDE_KEY];
  const totalPopulation = arenaUnique != null ? arenaUnique * 1000 : undefined;
  const battlegroundPopulation =
    battlegroundUnique != null ? battlegroundUnique * 200 : undefined;
  const shufflePopulation =
    shuffleRows.length > 0
      ? (() => {
        const totalUnique = shuffleRows.reduce(
          (acc, row) => acc + (row.entry.uniqueSpots ?? 0),
          0
        );
        return totalUnique > 0 ? totalUnique * 1000 : undefined;
      })()
      : undefined;
  const blitzPopulation =
    blitzRows.length > 0
      ? (() => {
        const totalUnique = blitzRows.reduce(
          (acc, row) => acc + (row.entry.uniqueSpots ?? 0),
          0
        );
        return totalUnique > 0 ? totalUnique * 1000 : undefined;
      })()
      : undefined;

  const populationCards = useMemo(() => {
    const cards = [
      { id: "arena3v3", label: "3v3 Arena", population: totalPopulation },
      {
        id: "rbg",
        label: "Rated Battlegrounds",
        population: battlegroundPopulation,
      },
      { id: "shuffle", label: "Solo Shuffle", population: shufflePopulation },
      {
        id: "blitz",
        label: "Blitz",
        population: blitzPopulation,
        hidden: blitzRows.length === 0,
      },
    ];
    const visibleCards = cards.filter((card) => !card.hidden);
    const sortedCards = visibleCards.sort((a, b) => {
      const aPop = a.population ?? -1;
      const bPop = b.population ?? -1;
      return bPop - aPop;
    });
    return sortedCards;
  }, [
    totalPopulation,
    battlegroundPopulation,
    shufflePopulation,
    blitzPopulation,
    blitzRows.length,
  ]);

  const definedPopulationCards = useMemo(
    () => populationCards.filter((card) => card.population !== undefined),
    [populationCards]
  );

  const populationTotal = useMemo(() => {
    if (definedPopulationCards.length === 0) return undefined;
    return definedPopulationCards.reduce(
      (acc, card) => acc + (card.population ?? 0),
      0
    );
  }, [definedPopulationCards]);

  const rankMap = useMemo(() => {
    const map = new Map<string, number>();
    definedPopulationCards.forEach((card, index) => {
      map.set(card.id, index + 1);
    });
    return map;
  }, [definedPopulationCards]);

  const cardsWithRanks = useMemo(
    () =>
      populationCards.map((card) => ({
        ...card,
        rank: rankMap.get(card.id),
      })),
    [populationCards, rankMap]
  );

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background effects */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[650px] w-[850px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-sky-500/10 blur-[160px]"></div>
        <div className="absolute bottom-0 left-0 h-[500px] w-[600px] -translate-x-1/4 translate-y-1/4 rounded-full bg-blue-600/7 blur-[140px]"></div>
        <div className="absolute bottom-1/4 right-0 h-[450px] w-[500px] translate-x-1/4 rounded-full bg-indigo-500/6 blur-[130px]"></div>
      </div>
      <SEO
        title={`PvP Cutoffs & Title Requirements • ${normalizedRegion.toUpperCase()}`}
        description={`Check current rating cutoffs for Gladiator, Rank 1, and other PvP titles in ${normalizedRegion.toUpperCase()}.`}
      />
      <Header />
      <main className="flex-1 pt-24 pb-12">
        <section className="relative px-3 sm:px-6 lg:px-10">
          <div className="mx-auto w-full max-w-6xl space-y-8">
            <div className="relative overflow-hidden rounded-2xl border border-sky-500/35 bg-gradient-to-r from-slate-950/90 via-slate-950/85 to-slate-900/80 px-6 py-8 shadow-[0_45px_110px_-70px_rgba(56,189,248,0.75)] backdrop-blur-xl">
              <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-sky-400/25 blur-[120px]"></div>
              <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-48 rounded-full bg-blue-900/50 blur-[120px]"></div>
              <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded-full bg-sky-500/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-sky-300">
                      Season {seasonName}
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                      Live Data
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
                    PvP Rating Cutoffs
                  </h1>
                  <p className="mt-2 max-w-lg text-sm text-slate-300/80">
                    Track Gladiator, Duelist, and Rival cutoffs across all
                    brackets. Data updated hourly from the Blizzard API.
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div className="flex items-center gap-2 rounded-xl border border-sky-500/20 bg-slate-900/70 px-4 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10">
                      <span className="text-lg font-bold text-sky-400">
                        {normalizedRegion.toUpperCase().charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-400">
                        Region
                      </div>
                      <div className="font-semibold text-white">
                        {normalizedRegion.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  {timestamp && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Updated {timestamp}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <BlizzardLoader />
              </div>
            ) : (
              <>
                {cardsWithRanks.length > 0 && (
                  <div className="relative overflow-hidden rounded-3xl border border-amber-400/20 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-slate-900/60 px-4 py-6 shadow-[0_45px_120px_-70px_rgba(245,158,11,0.55)] sm:px-6 sm:py-8">
                    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl"></div>
                    <div className="pointer-events-none absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-amber-600/5 blur-3xl"></div>
                    <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                          <svg
                            className="h-5 w-5 text-amber-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white sm:text-xl">
                            Bracket Populations
                          </h2>
                          <p className="text-xs text-amber-200/60">
                            Estimated active player counts
                          </p>
                        </div>
                      </div>
                      {populationTotal !== undefined && (
                        <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2">
                          <span className="text-xs uppercase tracking-wider text-amber-200/70">
                            Total
                          </span>
                          <span className="font-bold text-amber-100">
                            {formatPopulationDisplay(populationTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="relative grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {cardsWithRanks.map((card) => (
                        <PopulationCard
                          key={card.id}
                          label={card.label}
                          population={card.population}
                          rank={card.rank}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid gap-6 md:grid-cols-2">
                  {summaryCards.map((card, index) => (
                    <SummaryCard
                      key={`${card.title}-${index}`}
                      title={card.title}
                      subtitle={card.subtitle}
                      entry={card.entry}
                      showPredicted={card.showPredicted}
                    />
                  ))}
                </div>
                <div
                  className={`grid gap-6 ${blitzRows.length > 0 ? "lg:grid-cols-2" : ""
                    }`}
                >
                  <div className="group relative overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-950/90 to-slate-900/60 shadow-[0_35px_70px_-45px_rgba(15,23,42,0.9)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/40 hover:shadow-[0_55px_110px_-60px_rgba(56,189,248,0.45)]">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-500/5 blur-3xl transition-all duration-500 group-hover:bg-sky-500/10"></div>
                    <div className="relative border-b border-slate-800/70 px-6 py-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
                            <svg
                              className="h-5 w-5 text-sky-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-white">
                              Solo Shuffle Cutoffs
                            </h2>
                            <p className="text-sm text-slate-400">
                              Per-specialization rating thresholds
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-1.5">
                          <span className="text-sky-400">🏆</span>
                          <span className="text-sm font-medium text-sky-200">
                            {CUT_OFF_TITLES.shuffle}
                          </span>
                        </div>
                      </div>
                    </div>
                    {shuffleRows.length === 0 ? (
                      <div className="flex items-center justify-center px-6 py-16 text-sm text-slate-400">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 text-slate-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <p className="mt-3">
                            No shuffle cutoff data available yet
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-slate-800/50 bg-slate-900/40">
                            <tr>
                              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                                Spec
                              </th>
                              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
                                Cutoff
                              </th>
                              {hasShufflePredictions && (
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
                                  Predicted
                                </th>
                              )}
                              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
                                Spots
                              </th>
                              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
                                Unique
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {shuffleRows.map((row, index) => (
                              <tr
                                key={row.id}
                                className={`transition-all duration-200 hover:bg-sky-500/5 ${index % 2 === 0
                                  ? "bg-slate-900/20"
                                  : "bg-transparent"
                                  }`}
                              >
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                      <img
                                        className="h-9 w-9 rounded-lg border border-slate-700/50 bg-slate-800/80 p-0.5 shadow-lg"
                                        src={row.icon}
                                        loading="lazy"
                                        alt={`${row.name} icon`}
                                      />
                                    </div>
                                    <span className="font-medium text-white">
                                      {row.name}
                                    </span>
                                  </div>
                                </td>
                                <td
                                  className={`px-4 py-3.5 font-semibold tabular-nums ${getRatingColor(
                                    row.entry.rating
                                  )}`}
                                >
                                  {formatNumber(row.entry.rating)}
                                </td>
                                {hasShufflePredictions && (
                                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                                    <PredictedCutoffCell
                                      predicted={row.entry.predicted}
                                      rating={row.entry.rating}
                                    />
                                  </td>
                                )}
                                <td className="px-4 py-3.5 tabular-nums text-slate-400">
                                  {formatNumber(row.entry.totalSpots)}
                                </td>
                                <td className="px-4 py-3.5 tabular-nums text-slate-400">
                                  {formatNumber(row.entry.uniqueSpots)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  {blitzRows.length > 0 && (
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-800/70 bg-gradient-to-b from-slate-950/90 to-slate-900/60 shadow-[0_35px_70px_-45px_rgba(15,23,42,0.9)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-orange-400/40 hover:shadow-[0_55px_110px_-60px_rgba(249,115,22,0.45)]">
                      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-orange-500/5 blur-3xl transition-all duration-500 group-hover:bg-orange-500/10"></div>
                      <div className="relative border-b border-slate-800/70 px-6 py-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                              <svg
                                className="h-5 w-5 text-orange-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-white">
                                Blitz Cutoffs
                              </h2>
                              <p className="text-sm text-slate-400">
                                Battleground Blitz thresholds
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-1.5">
                            <span className="text-orange-400">🏆</span>
                            <span className="text-sm font-medium text-orange-200">
                              {CUT_OFF_TITLES.blitz}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="border-b border-slate-800/50 bg-slate-900/40">
                            <tr>
                              <th className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-slate-300">
                                Spec
                              </th>
                              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-orange-300">
                                Cutoff
                              </th>
                              {hasBlitzPredictions && (
                                <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-orange-300">
                                  Predicted
                                </th>
                              )}
                              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-orange-300">
                                Spots
                              </th>
                              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-orange-300">
                                Unique
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {blitzRows.map((row, index) => (
                              <tr
                                key={row.id}
                                className={`transition-all duration-200 hover:bg-orange-500/5 ${index % 2 === 0
                                  ? "bg-slate-900/20"
                                  : "bg-transparent"
                                  }`}
                              >
                                <td className="px-6 py-3.5">
                                  <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                      <img
                                        className="h-9 w-9 rounded-lg border border-slate-700/50 bg-slate-800/80 p-0.5 shadow-lg"
                                        src={row.icon}
                                        loading="lazy"
                                        alt={`${row.name} icon`}
                                      />
                                    </div>
                                    <span className="font-medium text-white">
                                      {row.name}
                                    </span>
                                  </div>
                                </td>
                                <td
                                  className={`px-4 py-3.5 font-semibold tabular-nums ${getRatingColor(
                                    row.entry.rating
                                  )}`}
                                >
                                  {formatNumber(row.entry.rating)}
                                </td>
                                {hasBlitzPredictions && (
                                  <td className="px-4 py-3.5 tabular-nums text-slate-300">
                                    <PredictedCutoffCell
                                      predicted={row.entry.predicted}
                                      rating={row.entry.rating}
                                    />
                                  </td>
                                )}
                                <td className="px-4 py-3.5 tabular-nums text-slate-400">
                                  {formatNumber(row.entry.totalSpots)}
                                </td>
                                <td className="px-4 py-3.5 tabular-nums text-slate-400">
                                  {formatNumber(row.entry.uniqueSpots)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Cutoffs;
