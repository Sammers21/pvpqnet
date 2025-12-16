import { useState, useMemo } from "react";
import { styled } from "@mui/material/styles";
import {
  Accordion as MuiAccordion,
  AccordionDetails as MuiAccordionDetails,
  AccordionProps,
  AccordionSummary as MuiAccordionSummary,
  AccordionSummaryProps,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { Achievement, Player } from "@/types";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import { getSeasonRankImage } from "@/utils/table";
import { getSeasonTitle, getSeasonTitleDescription } from "@/utils/profile";
import { getSeasonForTimestamp } from "@/constants/seasons";

import r1Notable from "@/assets/ranks/rank_r1_notable.png";
import heroHorde from "@/assets/ranks/hero_horde.png";
import heroAlliance from "@/assets/ranks/hero_alliance.png";
import rankGladiator from "@/assets/ranks/rank_gladiator_notable.png";
import rankLegend from "@/assets/ranks/rank_legend_notable.png";

const HERO_ALLIANCE_PREFIX = "Hero of the Alliance:";
const HERO_HORDE_PREFIX = "Hero of the Horde:";
const getHeroSeasonKey = (achievementName: string) => {
  if (achievementName.startsWith(HERO_ALLIANCE_PREFIX))
    return achievementName.slice(HERO_ALLIANCE_PREFIX.length).trim();
  if (achievementName.startsWith(HERO_HORDE_PREFIX))
    return achievementName.slice(HERO_HORDE_PREFIX.length).trim();
  return "";
};
const isPreferredHeroVariant = (achievementName: string, isHorde: boolean) => {
  if (isHorde) return achievementName.startsWith(HERO_HORDE_PREFIX);
  return achievementName.startsWith(HERO_ALLIANCE_PREFIX);
};

const SummaryCard = styled("div")(({ theme }) => ({
  background: "rgba(30, 41, 59, 0.4)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
  borderRadius: 12,
  padding: 16,
  display: "flex",
  alignItems: "center",
  transition: "all 0.2s ease-in-out",
  minWidth: 0,
  maxWidth: "100%",
  cursor: "pointer",

  "&:hover": {
    background: "rgba(30, 41, 59, 0.6)",
    borderColor: "rgba(245, 158, 11, 0.4)",
    transform: "translateY(-1px)",
    boxShadow:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
}));

const IconWrapper = styled("div")({
  position: "relative",
  marginRight: 16,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const StyledIcon = styled("img")({
  width: 48,
  height: 48,
  borderRadius: 8,
  objectFit: "contain",
  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
});

const CountBadge = styled("div")({
  position: "absolute",
  bottom: -6,
  right: -6,
  background: "#F59E0B",
  color: "#000",
  border: "2px solid #0F172A",
  borderRadius: "50%",
  width: 24,
  height: 24,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
  fontWeight: 700,
  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
  zIndex: 10,
});

const GridContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  width: "100%",
}));

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(() => ({
  borderRadius: 12,
  border: "1px solid rgba(71, 85, 105, 0.5)",
  backgroundColor: "rgba(15, 23, 42, 0.7)",
  marginBottom: 10,
  overflow: "hidden",
  transition: "all 0.2s ease",

  "&:hover": {
    borderColor: "rgba(96, 165, 250, 0.3)",
  },
  "&:not(:last-child)": {
    borderBottom: "1px solid rgba(71, 85, 105, 0.5)",
  },
  "&:before": {
    display: "none",
  },
  "&.Mui-expanded": {
    borderColor: "rgba(96, 165, 250, 0.4)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary {...props} />
))(({ theme }) => ({
  background:
    "linear-gradient(to right, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.8))",
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    color: "#60A5FACC",
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(71, 85, 105, 0.4)",
  background: "rgba(15, 23, 42, 0.6)",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiPaper-root": {
    backgroundColor: "#0F172A",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: 12,
    minWidth: "300px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  },
}));

type TitleMatch = {
  id: number;
  title: string;
  seasonName: string;
  rawName: string;
  rank: string;
  completedAt: number;
  expansionName: string;
};

interface IProps {
  player: Player;
}

const getTrackedTitles = (isHorde: boolean) => [
  // --- Notable Arena ---
  {
    key: "r1_3s",
    title: "Rank 1 in 3v3",
    description: "Rank 1 Arena title.",
    rank: "r1_3s",
    icon: r1Notable,
    matcher: (achievementName: string) => {
      const { title } = getSeasonTitle(achievementName);
      // R1 3v3 titles are like "Sinful Gladiator", "Cosmic Gladiator", etc.
      return title.endsWith(" Gladiator") && title !== "Gladiator";
    },
  },
  {
    key: "r1_shuffle",
    title: "Rank 1 in Solo",
    description: "Rank 1 Solo Shuffle title.",
    rank: "r1_shuffle",
    icon: r1Notable,
    matcher: (achievementName: string) => {
      const { title } = getSeasonTitle(achievementName);
      // R1 shuffle titles are like "Verdant Legend", "Cosmic Legend", etc.
      return title.endsWith(" Legend") && title !== "Legend";
    },
  },
  // --- Notable BG / Blitz ---
  {
    key: "hero",
    title: isHorde ? "Hero of the Horde" : "Hero of the Alliance",
    description: "Rank 1 Rated Battleground title.",
    rank: "r1_3s",
    icon: isHorde ? heroHorde : heroAlliance,
    matcher: (achievementName: string) => {
      return (
        achievementName.startsWith("Hero of the Alliance:") ||
        achievementName.startsWith("Hero of the Horde:")
      );
    },
  },
  {
    key: "r1_bg_blitz",
    title: "Rank 1 in Blitz",
    description: "Rank 1 Battleground Blitz title.",
    rank: "r1_3s",
    icon: r1Notable,
    matcher: (achievementName: string) => {
      const { title } = getSeasonTitle(achievementName);
      return title.endsWith(" Marshal") || title.endsWith(" Warlord");
    },
  },
  // --- Standard Highly Prestigious ---
  {
    key: "gladiator",
    title: "Gladiator",
    description: "Earn the Gladiator title in a season.",
    rank: "Gladiator",
    icon: rankGladiator,
    matcher: (achievementName: string) => {
      // Match "Gladiator: Season X" achievements (not R1 gladiator titles)
      return achievementName.startsWith("Gladiator:");
    },
  },
  {
    key: "legend",
    title: "Legend",
    description: "Win 100 Rated Solo Shuffle rounds at Elite rank.",
    rank: "Legend",
    icon: rankLegend,
    matcher: (achievementName: string) => {
      // Match "Legend: Season X" achievements (not R1 legend titles)
      return achievementName.startsWith("Legend:");
    },
  },
  {
    key: "strategist",
    title: "Strategist",
    description: "Win 25 Rated Battleground Blitz matches at Elite rank.",
    rank: "Legend",
    icon: rankLegend,
    matcher: (achievementName: string) => {
      return achievementName.startsWith("Strategist:");
    },
  },
];

const TitlesHistory = ({ player }: IProps) => {
  const [open, setOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const expansions = player.achievements?.titles_history.expansions || [];
  const isHorde = (player.fraction || "").toUpperCase() === "HORDE";

  // Collect all achievements from main character + alts, deduplicated by id
  const allAchievements = useMemo(() => {
    const seen = new Set<number>();
    const result: Achievement[] = [];

    // Add main character achievements
    const mainAchievements = player.achievements?.achievements || [];
    for (const ach of mainAchievements) {
      if (!seen.has(ach.id)) {
        seen.add(ach.id);
        result.push(ach);
      }
    }

    // Add alt achievements
    const alts = player.alts || [];
    for (const alt of alts) {
      const altAchievements = alt.achievements?.achievements || [];
      for (const ach of altAchievements) {
        if (!seen.has(ach.id)) {
          seen.add(ach.id);
          result.push(ach);
        }
      }
    }

    return result;
  }, [player]);

  const trackedTitles = useMemo(() => getTrackedTitles(isHorde), [isHorde]);

  const matches = useMemo(() => {
    const newMatches: Record<string, Array<TitleMatch>> = {};
    const heroIndexByKey = new Map<string, number>();
    trackedTitles.forEach((t) => (newMatches[t.key] = []));
    allAchievements.forEach((achievement) => {
      const { title: derivedTitle, name: seasonName } = getSeasonTitle(
        achievement.name
      );
      const completedAt = achievement.completed_timestamp;
      const seasonInfo = completedAt
        ? getSeasonForTimestamp(completedAt)
        : null;
      const expansionName = seasonInfo?.expansion || "Unknown";
      trackedTitles.forEach((t) => {
        if (t.matcher(achievement.name)) {
          const heroSeasonKey =
            t.key === "hero" ? getHeroSeasonKey(achievement.name) : "";
          const resolvedSeasonName =
            heroSeasonKey || seasonName || seasonInfo?.name || expansionName;
          const newMatch = {
            id: achievement.id,
            title: derivedTitle,
            seasonName: resolvedSeasonName,
            rawName: achievement.name,
            rank: t.rank,
            completedAt,
            expansionName,
          };
          if (t.key === "hero") {
            const heroKey = `${seasonInfo?.id ?? "unknown"}:${resolvedSeasonName.toLowerCase()}`;
            const existingIndex = heroIndexByKey.get(heroKey);
            if (existingIndex !== undefined) {
              const existing = newMatches[t.key][existingIndex];
              const shouldPreferNew =
                isPreferredHeroVariant(achievement.name, isHorde) &&
                !isPreferredHeroVariant(existing.rawName, isHorde);
              if (shouldPreferNew) newMatches[t.key][existingIndex] = newMatch;
              return;
            }
            newMatches[t.key].push(newMatch);
            heroIndexByKey.set(heroKey, newMatches[t.key].length - 1);
            return;
          }
          newMatches[t.key].push(newMatch);
        }
      });
    });
    return newMatches;
  }, [allAchievements, trackedTitles, isHorde]);

  const handleOpen = (key: string) => {
    if (matches[key].length > 0) {
      setSelectedKey(key);
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedKey(null);
  };

  const selectedTitleData = selectedKey
    ? trackedTitles.find((t) => t.key === selectedKey)
    : null;
  const selectedMatches = useMemo(
    () => (selectedKey ? matches[selectedKey] : []),
    [selectedKey, matches]
  );

  const groupedMatches = useMemo(() => {
    const sorted = [...selectedMatches].sort(
      (a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)
    );
    return sorted.reduce<Array<{ expansionName: string; items: TitleMatch[] }>>(
      (acc, match) => {
        const existing = acc.find(
          (g) => g.expansionName === match.expansionName
        );
        if (existing) {
          existing.items.push(match);
        } else {
          acc.push({ expansionName: match.expansionName, items: [match] });
        }
        return acc;
      },
      []
    );
  }, [selectedMatches]);

  return (
    <div className="flex grow justify-start flex-col border border-solid rounded-xl border-slate-600/40 px-6 py-6 bg-gradient-to-br from-slate-900/95 to-slate-800/90 shadow-2xl overflow-hidden">
      {/* SECTION 1: Notable Titles */}
      <div className="flex items-center gap-3 mb-6 border-b border-slate-700/50 pb-4">
        <EmojiEventsIcon className="!w-7 !h-7 text-amber-500 drop-shadow-md" />
        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
          Notable Titles
        </span>
      </div>

      {Object.keys(matches).some((key) => matches[key].length > 0) ? (
        <GridContainer>
          {trackedTitles
            .filter((t) => matches[t.key].length > 0)
            .map((t) => (
              <SummaryCard key={t.key} onClick={() => handleOpen(t.key)}>
                <IconWrapper>
                  <StyledIcon src={t.icon} alt={t.title} />
                  <CountBadge>{matches[t.key].length}</CountBadge>
                </IconWrapper>
                <div className="flex flex-col min-w-0 pr-1">
                  <span className="text-gray-100 font-bold text-base truncate drop-shadow-sm">
                    {t.title}
                  </span>
                  <span className="text-xs text-slate-400 font-medium leading-snug mt-0.5 line-clamp-2">
                    {t.description}
                  </span>
                </div>
              </SummaryCard>
            ))}
        </GridContainer>
      ) : null}

      {/* SECTION 2: Titles History */}
      <div className="flex items-center gap-3 mt-8 mb-6 border-b border-slate-700/50 pb-4">
        <HistoryIcon className="!w-7 !h-7 text-blue-400 drop-shadow-md" />
        <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-500">
          Titles History
        </span>
      </div>

      {expansions.length === 0 && (
        <p className="text-[#9CA3AF] text-sm">No title history available.</p>
      )}

      {expansions.map((expansion) => (
        <Accordion key={expansion.name} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography className="!font-semibold !text-white/90 !text-lg">
              {expansion.name}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {expansion.seasons
              .slice()
              .reverse()
              .map((season) => {
                const imageSrc = getSeasonRankImage(season.rank);
                const { name, title } = getSeasonTitle(
                  season.highest_achievement.name
                );

                return (
                  <div
                    key={season.highest_achievement.completed_timestamp + name}
                    className="flex items-center p-2.5 rounded-lg bg-[#0F172A]/45 border border-slate-700/30 hover:bg-[#60A5FA0A] transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        className="w-12 h-12 mr-3 drop-shadow-md object-contain"
                        src={imageSrc}
                        alt="achievement"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#60A5FACC] uppercase tracking-wide">
                        {name}
                      </span>
                      <span className="text-sm font-semibold text-white mt-0.5 break-words">
                        {title}
                      </span>
                      <span className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug">
                        {getSeasonTitleDescription(
                          title,
                          season.highest_achievement.name,
                          expansion.name
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* POPUP DIALOG */}
      <StyledDialog open={open} onClose={handleClose}>
        <DialogTitle className="!flex !justify-between !items-center !pb-2 !pt-4 !px-6 border-b border-slate-700/50">
          <span className="text-xl font-bold text-white">
            {selectedTitleData?.title}
          </span>
          <IconButton
            onClick={handleClose}
            size="small"
            className="!text-slate-400 hover:!text-white"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4 overflow-y-auto max-h-[60vh]">
          {groupedMatches.map((group) => (
            <div key={group.expansionName} className="mb-3 last:mb-0">
              <div className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-2 px-1">
                {group.expansionName}
              </div>
              {group.items.map((match, index) => {
                const displayName =
                  match.rawName.includes("Legend:") ||
                  match.rawName.includes("Strategist:") ||
                  match.rawName.includes("Hero of the")
                    ? match.rawName
                    : match.title;

                return (
                  <div
                    key={`${group.expansionName}-${index}`}
                    className="flex items-center p-3 rounded-lg bg-[#0F172A]/50 border border-slate-700/30 hover:bg-[#60A5FA08] transition-colors mb-2 last:mb-0"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        className="w-12 h-12 mr-4 drop-shadow-lg object-contain"
                        src={getSeasonRankImage(match.rank)}
                        alt="achievement"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold text-[#60A5FACC] uppercase tracking-wide">
                        {match.seasonName}
                      </span>
                      <span className="text-base font-semibold text-white mt-0.5 break-words">
                        {displayName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </DialogContent>
      </StyledDialog>
    </div>
  );
};

export default TitlesHistory;
