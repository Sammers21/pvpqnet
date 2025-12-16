import type { SvgIconComponent } from "@mui/icons-material";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import SecurityIcon from "@mui/icons-material/Security";

import ShuffleIcon from "@mui/icons-material/Shuffle";



import type { Player, PlayerMulticlassStanding } from "@/types";
import { capitalizeFirstLetter } from "@/utils/common";

type RoleMeta = {
  label: string;
  icon: SvgIconComponent;
  accentClass: string;
};

const ROLE_META: Record<string, RoleMeta> = {
  ALL: {
    label: "All Roles",
    icon: AllInclusiveIcon,
    accentClass: "text-sky-400",
  },
  DPS: { label: "DPS", icon: WhatshotIcon, accentClass: "text-orange-400" },
  HEALER: {
    label: "Healer",
    icon: LocalHospitalIcon,
    accentClass: "text-emerald-400",
  },
  MELEE: { label: "Melee", icon: SportsMmaIcon, accentClass: "text-rose-400" },
  RANGED: {
    label: "Ranged",
    icon: GpsFixedIcon,
    accentClass: "text-indigo-300",
  },
  TANK: { label: "Tank", icon: SecurityIcon, accentClass: "text-yellow-300" },
};

const normalizeRoleLabel = (role?: string) => {
  if (!role) return "Role";
  const lower = role.toLowerCase();
  return capitalizeFirstLetter(lower);
};

const normalizeStandings = (entries: PlayerMulticlassStanding[] = []) =>
  entries
    .filter(
      (entry) =>
        typeof entry.rank === "number" &&
        entry.rank > 0 &&
        typeof entry.score === "number"
    )
    .sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity));

const rankTiers = [
  { min: 1, max: 15, label: "Legendary", color: "#ff8000" },
  { min: 16, max: 100, label: "Epic", color: "#a335ee" },
  { min: 101, max: 1000, label: "Rare", color: "#0070dd" },
  {
    min: 1001,
    max: Number.POSITIVE_INFINITY,
    label: "Common",
    color: "#f5f5f5",
  },
];

const getRankTier = (rank?: number) => {
  if (!rank || rank < 1) {
    return rankTiers[rankTiers.length - 1];
  }
  return (
    rankTiers.find((tier) => rank >= tier.min && rank <= tier.max) ??
    rankTiers[rankTiers.length - 1]
  );
};

const MulticlassersCard = ({ player }: { player: Player }) => {
  const standings = normalizeStandings(player.multiclassers);
  if (!standings.length) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/40 p-3 shadow-xl backdrop-blur-md transition-all hover:bg-slate-900/50">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-sky-500/10 blur-[60px]" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-[60px]" />

      <div className="relative mb-3 flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 ring-1 ring-inset ring-sky-500/20">
            <ShuffleIcon className="!h-5 !w-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">
                Shuffle Multiclass
              </span>
              <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-sky-400 ring-1 ring-inset ring-sky-500/20">
                Live
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              Combined ratings across roles
            </span>
          </div>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
        {standings.map(({ role, rank, score }) => {
          const tier = getRankTier(rank);
          const meta = ROLE_META[role?.toUpperCase?.() ?? ""] ?? {
            label: normalizeRoleLabel(role),
            icon: LeaderboardIcon,
            accentClass: "text-slate-300",
          };
          const Icon = meta.icon;

          return (
            <div
              key={`${role}-${rank}`}
              className="group relative flex items-center justify-between overflow-hidden rounded-lg border border-white/5 bg-slate-900/40 py-2.5 pl-2.5 pr-3 transition-all hover:border-white/10 hover:bg-slate-800/60 hover:shadow-lg hover:shadow-black/20"
            >
              <div
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `linear-gradient(to right, transparent, ${tier.color}08)` }}
              />
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px]"
                style={{ backgroundColor: tier.color, boxShadow: `0 0 12px 2px ${tier.color}66` }}
              />

              <div className="relative flex min-w-0 flex-1 items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-950 shadow-inner ring-1 ring-inset ring-white/5"
                >
                  <Icon className={`${meta.accentClass} !h-4.5 !w-4.5 opacity-90 transition-transform duration-300 group-hover:scale-110`} />
                </div>

                <div className="flex flex-col justify-center overflow-hidden">
                  <span className="truncate text-xs font-bold text-slate-200 transition-colors group-hover:text-white">
                    {meta.label}
                  </span>
                  <span
                    className="truncate text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: tier.color, textShadow: `0 0 10px ${tier.color}40` }}
                  >
                    {tier.label}
                  </span>
                </div>
              </div>

              <div className="relative ml-2 flex shrink-0 items-center divide-x divide-white/5 text-right">
                <div className="px-2.5">
                  <div className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Rank</div>
                  <div className="text-sm font-bold text-white">#{rank}</div>
                </div>
                <div className="pl-2.5">
                  <div className="text-[9px] font-medium uppercase tracking-wider text-slate-500">Score</div>
                  <div className="text-sm font-bold tabular-nums" style={{ color: tier.color }}>
                    {Number(score ?? 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MulticlassersCard;
