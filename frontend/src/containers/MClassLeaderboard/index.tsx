import { REGION } from "@/constants/region";
import {
  fetchBracketActivity,
  getMulticlasserLeaderboard,
} from "@/services/stats.service";
import { capitalizeFirstLetter } from "@/utils/common";
import { getRegion } from "@/utils/urlparts";
import { TANK_SPECS } from "@/utils/roles";
import {
  SEARCH_PARAM_TO_FULL_SPEC,
  SEARCH_PARAM_TO_SPEC,
} from "@/constants/filterSchema";
import {
  getAltProfileUrl,
  getClassNameColor,
  getSpecIcon,
  ratingToColor,
} from "@/utils/table";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Pagination,
  Tooltip,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import useMediaQuery from "@mui/material/useMediaQuery";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import SecurityIcon from "@mui/icons-material/Security";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ShieldIcon from "@mui/icons-material/Shield";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  GridCellParams,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
  GridValueGetterParams,
} from "@mui/x-data-grid";
import * as React from "react";
import { useParams } from "react-router-dom";
import { StripedDataGrid } from "../Meta/Grid";
import GearModal from "@/containers/Profile/GearModal";
import type { Player } from "@/types";
import "./styles.css";

const SHUFFLE_CUTOFF_PREFIX = "SHUFFLE/";

// Build reverse lookup: full spec name -> spec code
const fullSpecToCode: Record<string, string> = {};
Object.entries(SEARCH_PARAM_TO_FULL_SPEC).forEach(([key, fullName]) => {
  const code = (SEARCH_PARAM_TO_SPEC as Record<string, string>)[key];
  if (code) {
    fullSpecToCode[fullName] = code;
  }
});

type SpotCounts = Record<string, number | undefined>;

type SpecScore = {
  score: number;
  rank_without_alts: number;
  percentile: number;
  scoring_tier: string;
  character: {
    pos: number;
    rating: number;
    in_cutoff: boolean;
  };
};

type MulticlasserRow = GridValidRowModel & {
  rank: number;
  total_score: number;
  rank_without_alts?: number;
  percentile?: number;
  scoring_tier?: string;
  main?: {
    name: string;
    realm: string;
    class: string;
    region?: REGION;
  };
  specs?: Record<string, SpecScore>;
};

const DEFAULT_MAX_SPEC_CHIPS = 8;
const TABLE_MIN_HEIGHT = 500;
const SKELETON_ROW_COUNT = 100;

type ColumnOptions = {
  maxSpecChips: number;
  specMinWidth: number;
  mobile: boolean;
  spotCounts: SpotCounts;
};

type RoleFilter = {
  value: string;
  label: string;
  icon: SvgIconComponent;
  accentClass: string;
};

const roleFilters: RoleFilter[] = [
  {
    value: "all",
    label: "All",
    icon: AllInclusiveIcon,
    accentClass: "mclass-tab-icon--all",
  },
  {
    value: "dps",
    label: "DPS",
    icon: WhatshotIcon,
    accentClass: "mclass-tab-icon--dps",
  },
  {
    value: "healer",
    label: "Healer",
    icon: LocalHospitalIcon,
    accentClass: "mclass-tab-icon--healer",
  },
  {
    value: "melee",
    label: "Melee",
    icon: SportsMmaIcon,
    accentClass: "mclass-tab-icon--melee",
  },
  {
    value: "ranged",
    label: "Ranged",
    icon: GpsFixedIcon,
    accentClass: "mclass-tab-icon--ranged",
  },
  {
    value: "tank",
    label: "Tank",
    icon: SecurityIcon,
    accentClass: "mclass-tab-icon--tank",
  },
];

const getMaxScoreForSpec = (specName: string): number => {
  return TANK_SPECS.includes(specName) ? 400 : 1000;
};

// Scoring tiers based on Calculator.java
// spotCount = number of R1 spots (0.1% of ladder)
// So total ladder ≈ spotCount * 1000
const SCORING_TIERS = [
  { minMult: 0, maxMult: 1, minScore: 1000, maxScore: 900, label: "Top 0.1%" },
  {
    minMult: 1,
    maxMult: 2,
    minScore: 900,
    maxScore: 750,
    label: "0.1% – 0.2%",
  },
  {
    minMult: 2,
    maxMult: 5,
    minScore: 750,
    maxScore: 550,
    label: "0.2% – 0.5%",
  },
  { minMult: 5, maxMult: 10, minScore: 550, maxScore: 300, label: "0.5% – 1%" },
  { minMult: 10, maxMult: 20, minScore: 300, maxScore: 150, label: "1% – 2%" },
  { minMult: 20, maxMult: 50, minScore: 150, maxScore: 50, label: "2% – 5%" },
  { minMult: 50, maxMult: 1000, minScore: 50, maxScore: 0, label: "5% – 100%" },
];

const SCORING_RULES_UI = SCORING_TIERS.map((tier) => ({
  percentile: tier.label,
  score: `${tier.maxScore} – ${tier.minScore}`,
}));

interface ScoreCalculation {
  percentile: number;
  percentileStr: string;
  tier: (typeof SCORING_TIERS)[0] | null;
  nextTier: (typeof SCORING_TIERS)[0] | null;
  targetPositionForNextTier: number | null;
  estimatedLadderSize: number;
  spotCount: number;
  explanation: string;
}

const calculateScoreDetails = (
  rank: number,
  spotCount: number | undefined
): ScoreCalculation | null => {
  if (!spotCount || spotCount === 0) return null;

  // spotCount = R1 spots = 0.1% of ladder
  // So estimated ladder size = spotCount * 1000
  const estimatedLadderSize = spotCount * 1000;
  const percentile = (rank / estimatedLadderSize) * 100;

  // Format percentile string
  let percentileStr: string;
  if (percentile < 0.01) {
    percentileStr = "<0.01%";
  } else if (percentile < 0.1) {
    percentileStr = `${percentile.toFixed(3)}%`;
  } else if (percentile < 1) {
    percentileStr = `${percentile.toFixed(2)}%`;
  } else if (percentile < 10) {
    percentileStr = `${percentile.toFixed(1)}%`;
  } else {
    percentileStr = `${Math.round(percentile)}%`;
  }

  // Find which tier this rank falls into and the next tier
  let tier: (typeof SCORING_TIERS)[0] | null = null;
  let nextTier: (typeof SCORING_TIERS)[0] | null = null;
  let targetPositionForNextTier: number | null = null;

  for (let i = 0; i < SCORING_TIERS.length; i++) {
    const t = SCORING_TIERS[i];
    const minRank = t.minMult * spotCount;
    const maxRank = t.maxMult * spotCount;
    if (rank >= minRank && rank <= maxRank) {
      tier = t;
      // Next tier is the one before (higher score tier)
      if (i > 0) {
        nextTier = SCORING_TIERS[i - 1];
        // Target position is the max rank of the next tier (to enter that tier)
        targetPositionForNextTier = Math.floor(nextTier.maxMult * spotCount);
      }
      break;
    }
  }

  // Build explanation
  const explanation = `Rank #${rank} out of ~${estimatedLadderSize.toLocaleString()} players (${spotCount} R1 spots × 1000)`;

  return {
    percentile,
    percentileStr,
    tier,
    nextTier,
    targetPositionForNextTier,
    estimatedLadderSize,
    spotCount,
    explanation,
  };
};

// Calculate score using the same algorithm as Calculator.java
const calculateScore = (rank: number, spotCount: number): number => {
  for (const tier of SCORING_TIERS) {
    const ladderSpotFrom = tier.minMult * spotCount;
    const ladderSpotTo = tier.maxMult * spotCount;
    const spotsInRange = ladderSpotTo - ladderSpotFrom;
    const scoreRange = tier.minScore - tier.maxScore;

    if (rank >= ladderSpotFrom && rank <= ladderSpotTo) {
      const ladderPosInRange = rank - ladderSpotFrom - 1;
      const score =
        tier.minScore - (ladderPosInRange * scoreRange) / spotsInRange;
      return Math.max(0, Math.floor(score));
    }
  }
  return 0;
};

interface ScoreCellProps extends GridRenderCellParams<MulticlasserRow, number> {
  spotCounts: SpotCounts;
}

type SpecBreakdownItem = {
  name: string;
  score: number;
  isTank: boolean;
  maxScore: number;
  scorePercent: number;
  ladderPos: number;
  rankWithoutAlts: number;
  spotCount?: number;
  scoreDetails: ScoreCalculation | null;
  baseScore: number;
  actualScore: number;
};

interface ScoreBreakdownDialogProps {
  open: boolean;
  onClose: () => void;
  playerLabel: string;
  totalScore: number;
  specItems: SpecBreakdownItem[];
}

const ScoreBreakdownDialog: React.FC<ScoreBreakdownDialogProps> = ({
  open,
  onClose,
  playerLabel,
  totalScore,
  specItems,
}) => {
  const hasTankSpec = specItems.some((s) => s.isTank);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      PaperProps={{ className: "mclass-score-dialog__paper" }}
    >
      <DialogTitle className="mclass-score-dialog__title">
        <div className="mclass-score-dialog__title-left">
          <span className="mclass-score-dialog__kicker">Score Breakdown</span>
          <span className="mclass-score-dialog__player">{playerLabel}</span>
        </div>
        <div className="mclass-score-dialog__title-right">
          <div className="mclass-score-dialog__total-wrap">
            <span className="mclass-score-dialog__total-label">Total</span>
            <span className="mclass-score-dialog__total-value">
              {totalScore} pts
            </span>
          </div>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="mclass-score-dialog__close"
            aria-label="Close score breakdown"
          >
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent className="mclass-score-dialog__content">
        <div className="mclass-score-dialog">
          <div className="mclass-orb mclass-orb--one" />
          <div className="mclass-orb mclass-orb--two" />
          <div className="mclass-grid-overlay" />
          <div className="mclass-container mclass-score-dialog__container">
            <section className="mclass-card mclass-score-dialog__hero">
              <div className="mclass-score-dialog__hero-head">
                <span className="mclass-score-dialog__hero-title">
                  How spec points are calculated
                </span>
                <div className="mclass-score-dialog__hero-subtitle">
                  <span>Rank Without Alts → percentile → tier points.</span>
                  <span className="mclass-score-dialog__hero-subtitle-note">
                    Data refreshes ~every 3 hours on average (not live).
                  </span>
                  {hasTankSpec && (
                    <span className="mclass-score-dialog__hero-subtitle-note">
                      Tank specs are scaled to 40% (max 400).
                    </span>
                  )}
                </div>
              </div>
              <div className="mclass-score-dialog__steps">
                <div className="mclass-score-dialog__step">
                  <span className="mclass-score-dialog__step-num">1</span>
                  <span className="mclass-score-dialog__step-text">
                    We use your <strong>Rank Without Alts</strong> for the spec.
                  </span>
                </div>
                <div className="mclass-score-dialog__step">
                  <span className="mclass-score-dialog__step-num">2</span>
                  <span className="mclass-score-dialog__step-text">
                    Ladder size is estimated as <strong>R1 spots × 1000</strong>{" "}
                    (R1 spots = top 0.1%).
                  </span>
                </div>
                <div className="mclass-score-dialog__step">
                  <span className="mclass-score-dialog__step-num">3</span>
                  <span className="mclass-score-dialog__step-text">
                    Percentile is mapped into a tier and points scale linearly
                    within that tier.
                  </span>
                </div>
              </div>
              <div className="mclass-score-dialog__tiers">
                <div className="mclass-scoring-tiers-section mclass-score-dialog__tiers-section">
                  <div className="mclass-scoring-tiers-header">
                    <span className="mclass-scoring-title">
                      Percentile → Points
                    </span>
                    <div className="mclass-max-badges">
                      <div className="mclass-max-badge mclass-max-badge--dps">
                        <span className="mclass-max-badge__label">Max</span>
                        <span className="mclass-max-badge__value">1000</span>
                      </div>
                      <div className="mclass-max-badge mclass-max-badge--tank">
                        <SecurityIcon className="mclass-max-badge__icon" />
                        <span className="mclass-max-badge__label">Tank</span>
                        <span className="mclass-max-badge__value">400</span>
                      </div>
                    </div>
                  </div>

                  <div className="mclass-scoring-tiers">
                    {SCORING_RULES_UI.map((rule, index) => {
                      const isTop = index === 0;
                      const isLow = index >= 5;
                      return (
                        <div
                          key={rule.percentile}
                          className={`mclass-scoring-tier ${isTop ? "mclass-scoring-tier--top" : ""
                            } ${isLow ? "mclass-scoring-tier--low" : ""}`}
                        >
                          <span className="mclass-scoring-tier__percentile">
                            {rule.percentile}
                          </span>
                          <span className="mclass-scoring-tier__score">
                            {rule.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
            <section className="mclass-card mclass-score-dialog__specs">
              <div className="mclass-score-dialog__specs-head">
                <span className="mclass-score-dialog__specs-title">Specs</span>
                <span className="mclass-score-dialog__specs-subtitle">
                  Each card explains why that spec contributes its points.
                </span>
              </div>
              <div className="mclass-score-dialog__spec-grid">
                {specItems.map((spec) => {
                  const tier = spec.scoreDetails?.tier ?? null;
                  const nextTier = spec.scoreDetails?.nextTier ?? null;
                  const targetPos =
                    spec.scoreDetails?.targetPositionForNextTier ?? null;
                  const ranksToGo =
                    nextTier && targetPos !== null
                      ? Math.max(spec.rankWithoutAlts - targetPos, 0)
                      : null;
                  const scaleTierScore = (score: number) =>
                    spec.isTank ? score / 2.5 : score;

                  const compactTierLabel = (label: string) => {
                    if (label === "5% – 100%") return "5%+";
                    if (label.startsWith("Top ")) return label.replace("Top ", "Top");
                    const cleaned = label.replace(/\s*–\s*/g, "–");
                    const match = cleaned.match(/^(.+?)%–(.+?)%$/);
                    if (match) return `${match[1]}–${match[2]}%`;
                    return cleaned;
                  };

                  const barTierRanges = spec.scoreDetails
                    ? SCORING_TIERS.map((t) => {
                        const startScore = scaleTierScore(t.maxScore);
                        const endScore = scaleTierScore(t.minScore);
                        const centerScore = (startScore + endScore) / 2;
                        const centerPct = (centerScore / spec.maxScore) * 100;
                        return {
                          key: t.label,
                          label: compactTierLabel(t.label),
                          leftPct: (startScore / spec.maxScore) * 100,
                          widthPct:
                            ((endScore - startScore) / spec.maxScore) * 100,
                          centerPct,
                          isCurrent: tier === t,
                          isNext: nextTier === t,
                        };
                      }).sort((a, b) => a.leftPct - b.leftPct)
                    : null;

                  const nextTierThresholdPct =
                    barTierRanges?.find((seg) => seg.isNext)?.leftPct ?? null;

                  return (
                    <div
                      key={spec.name}
                      className="mclass-score-dialog__spec-card"
                    >
                      <div className="mclass-score-dialog__spec-card-head">
                        <div className="mclass-score-dialog__spec-meta">
                          <img
                            className="mclass-score-dialog__spec-icon"
                            src={getSpecIcon(spec.name)}
                            alt={spec.name}
                          />
                          <div className="mclass-score-dialog__spec-title">
                            <span className="mclass-score-dialog__spec-name">
                              {spec.name}
                            </span>
                            {spec.isTank && (
                              <span className="mclass-score-dialog__tank-badge">
                                Tank ½
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="mclass-score-dialog__spec-score">
                          +{spec.score}
                        </span>
                      </div>
                      {spec.scoreDetails ? (
                        <>
                          <div className="mclass-score-dialog__spec-explainer">
                            <div className="mclass-score-dialog__spec-explainer-line">
                              {spec.scoreDetails.explanation}
                            </div>
                            <div className="mclass-score-dialog__spec-explainer-meta">
                              {tier && (
                                <span className="mclass-score-dialog__meta-pill">
                                  Tier <strong>{tier.label}</strong>{" "}
                                  <span className="mclass-score-dialog__meta-pill-sub">
                                    ({tier.maxScore}–{tier.minScore} pts)
                                  </span>
                                </span>
                              )}
                              {spec.isTank && (
                                <span className="mclass-score-dialog__meta-pill mclass-score-dialog__meta-pill--tank">
                                  Tank modifier: {spec.baseScore} × 40% ={" "}
                                  {spec.actualScore}
                                </span>
                              )}
                            </div>
                          </div>
                          {nextTier && targetPos !== null && (
                            <div className="mclass-score-dialog__next-tier">
                              <div className="mclass-score-dialog__next-tier-left">
                                <span className="mclass-score-dialog__next-tier-kicker">
                                  Next scoring tier
                                </span>
                                <span className="mclass-score-dialog__next-tier-label">
                                  {nextTier.label}
                                </span>
                                {typeof ranksToGo === "number" &&
                                  ranksToGo > 0 && (
                                    <span className="mclass-score-dialog__next-tier-delta">
                                      {ranksToGo} ranks to go
                                    </span>
                                  )}
                              </div>
                              <div className="mclass-score-dialog__next-tier-right">
                                <span className="mclass-score-dialog__next-tier-rank">
                                  ≤ #{targetPos.toLocaleString()}
                                </span>
                                <span className="mclass-score-dialog__next-tier-caption">
                                  rank w/o alts
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="mclass-score-dialog__stat-grid">
                            <div className="mclass-score-dialog__stat">
                              <span className="mclass-score-dialog__stat-label">
                                Ladder Position
                              </span>
                              <span className="mclass-score-dialog__stat-value">
                                #{spec.ladderPos}
                              </span>
                            </div>
                            <div className="mclass-score-dialog__stat mclass-score-dialog__stat--highlight">
                              <span className="mclass-score-dialog__stat-label">
                                Rank Without Alts
                              </span>
                              <span className="mclass-score-dialog__stat-value mclass-score-dialog__stat-value--accent">
                                #{spec.rankWithoutAlts}
                              </span>
                            </div>
                            <div className="mclass-score-dialog__stat">
                              <span className="mclass-score-dialog__stat-label">
                                R1 Spots (0.1%)
                              </span>
                              <span className="mclass-score-dialog__stat-value">
                                {spec.scoreDetails.spotCount.toLocaleString()}
                              </span>
                            </div>
                            <div className="mclass-score-dialog__stat">
                              <span className="mclass-score-dialog__stat-label">
                                Est. Ladder Size
                              </span>
                              <span className="mclass-score-dialog__stat-value">
                                ~
                                {spec.scoreDetails.estimatedLadderSize.toLocaleString()}
                              </span>
                            </div>
                            <div className="mclass-score-dialog__stat mclass-score-dialog__stat--highlight">
                              <span className="mclass-score-dialog__stat-label">
                                Your Percentile
                              </span>
                              <span className="mclass-score-dialog__stat-value mclass-score-dialog__stat-value--accent">
                                {spec.scoreDetails.percentileStr}
                              </span>
                            </div>
                          </div>
                          <div className="mclass-score-dialog__formula">
                            #{spec.rankWithoutAlts} / (
                            {spec.scoreDetails.spotCount} × 1000) ={" "}
                            {spec.scoreDetails.percentileStr}
                          </div>
                        </>
                      ) : (
                        <div className="mclass-score-dialog__spec-explainer mclass-score-dialog__spec-explainer--muted">
                          Ladder Rank #{spec.ladderPos} • Rank Without Alts: #
                          {spec.rankWithoutAlts} • Percentile data unavailable
                        </div>
                      )}
                      <div className="mclass-score-dialog__bar-container">
                        <div
                          className={`mclass-score-dialog__bar ${spec.isTank ? "mclass-score-dialog__bar--tank" : ""
                            }`}
                          style={{
                            width: `${Math.min(spec.scorePercent, 100)}%`,
                          }}
                        />
                        {barTierRanges && (
                          <div
                            className="mclass-score-dialog__bar-tiers"
                            aria-hidden={true}
                          >
                            {barTierRanges.map((seg, index) => (
                              <div
                                key={seg.key}
                                className={`mclass-score-dialog__bar-tier ${index % 2 === 0 ? "mclass-score-dialog__bar-tier--alt" : ""
                                  } ${seg.isCurrent
                                    ? "mclass-score-dialog__bar-tier--current"
                                    : ""
                                  } ${seg.isNext
                                    ? "mclass-score-dialog__bar-tier--next"
                                    : ""
                                  }`}
                                style={{
                                  left: `${Math.max(
                                    0,
                                    Math.min(seg.leftPct, 100)
                                  )}%`,
                                  width: `${Math.max(
                                    0,
                                    Math.min(seg.widthPct, 100)
                                  )}%`,
                                }}
                              />
                            ))}
                            {typeof nextTierThresholdPct === "number" && (
                              <div
                                className="mclass-score-dialog__bar-marker mclass-score-dialog__bar-marker--next"
                                style={{
                                  left: `${Math.max(
                                    0,
                                    Math.min(nextTierThresholdPct, 100)
                                  )}%`,
                                }}
                              />
                            )}
                          </div>
                        )}
                        {barTierRanges && (
                          <div
                            className="mclass-score-dialog__bar-labels"
                            aria-hidden={true}
                          >
                            {barTierRanges.map((seg) => (
                              <div
                                key={`${seg.key}-label`}
                                className={`mclass-score-dialog__bar-label ${seg.isCurrent
                                  ? "mclass-score-dialog__bar-label--current"
                                  : ""
                                  } ${seg.isNext
                                    ? "mclass-score-dialog__bar-label--next"
                                    : ""
                                  }`}
                                style={{
                                  left: `${Math.max(
                                    0,
                                    Math.min(seg.leftPct, 100)
                                  )}%`,
                                  width: `${Math.max(
                                    0,
                                    Math.min(seg.widthPct, 100)
                                  )}%`,
                                }}
                              >
                                <span className="mclass-score-dialog__bar-label-text">
                                  {seg.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mclass-score-dialog__bar-caption">
                        {spec.score} / {spec.maxScore} max
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ScoreCell: React.FC<ScoreCellProps> = ({ value, row, spotCounts }) => {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const specs = React.useMemo<Record<string, SpecScore>>(() => {
    return row?.specs ?? {};
  }, [row?.specs]);
  const specItems = React.useMemo<SpecBreakdownItem[]>(() => {
    const entries: SpecBreakdownItem[] = Object.keys(specs).map((name) => {
      const data = specs[name];
      const maxScore = getMaxScoreForSpec(name);
      const isTank = TANK_SPECS.includes(name);
      const scorePercent = (data.score / maxScore) * 100;
      const specCode = fullSpecToCode[name];
      const spotKey = specCode ? `${SHUFFLE_CUTOFF_PREFIX}${specCode}` : "";
      const spotCount = spotKey ? spotCounts[spotKey] : undefined;
      const rankWithoutAlts = data.rank_without_alts;
      const ladderPos = data.character.pos;
      const scoreDetails = calculateScoreDetails(rankWithoutAlts, spotCount);
      const baseScore = spotCount
        ? calculateScore(rankWithoutAlts, spotCount)
        : data.score;
      const actualScore = isTank ? Math.floor(baseScore / 2.5) : baseScore;
      return {
        name,
        score: data.score,
        isTank,
        maxScore,
        scorePercent,
        ladderPos,
        rankWithoutAlts,
        spotCount,
        scoreDetails,
        baseScore,
        actualScore,
      };
    });
    entries.sort((a, b) => b.score - a.score);
    return entries;
  }, [specs, spotCounts]);

  const handleDialogOpen = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (dialogOpen) return;
    setDialogOpen(true);
  };

  const totalScore = typeof value === "number" ? value : 0;
  const playerLabel = React.useMemo(() => {
    const main = row?.main;
    if (main?.name && main?.realm) {
      return capitalizeFirstLetter(`${main.name}-${main.realm}`);
    }
    return `Rank #${row?.rank ?? ""}`;
  }, [row?.main, row?.rank]);

  return (
    <div className="mclass-score-cell" onClick={handleDialogOpen}>
      <Typography variant="body1" className="mclass-score-value">
        {value}
      </Typography>
      <IconButton
        size="small"
        className="mclass-score-cell__info-btn"
        onClick={handleDialogOpen}
        aria-label="Open full score breakdown"
      >
        <InfoOutlinedIcon className="mclass-score-cell__info-icon" />
      </IconButton>
      <ScoreBreakdownDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        playerLabel={playerLabel}
        totalScore={totalScore}
        specItems={specItems}
      />
    </div>
  );
};

// Gear icon cell for viewing equipment (inline with name)
interface GearCellProps {
  main: MulticlasserRow["main"];
  region: REGION;
}

const GearCell: React.FC<GearCellProps> = ({ main, region }) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  if (!main) return null;

  const player: Player = {
    id: 0,
    name: main.name,
    class: main.class,
    fraction: "",
    realm: main.realm,
    gender: "",
    itemLevel: 0,
    lastUpdatedUTCms: 0,
    activeSpec: "",
    race: "",
    region: region,
    talents: "",
    achievements: { achievements: [], titles_history: { expansions: [] } },
    pvpTalents: [],
  };

  return (
    <>
      <Tooltip title="View Gear & PvP Talents" placement="top">
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModalOpen(true);
          }}
          sx={{
            opacity: 0,
            transition: "opacity 0.15s ease, transform 0.15s ease",
            color: "#60A5FA",
            padding: "2px",
            marginRight: "12px",
            ".MuiDataGrid-row:hover &": {
              opacity: 1,
            },
            "&:hover": {
              backgroundColor: "rgba(96, 165, 250, 0.15)",
              transform: "scale(1.1)",
            },
          }}
        >
          <ShieldIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <GearModal
        player={player}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

function columns(
  region: REGION,
  options: ColumnOptions
): GridColDef<MulticlasserRow>[] {
  return [
    {
      field: "rank",
      headerName: "Rank",
      width: options.mobile ? 68 : 80,
      valueFormatter: (
        params: GridValueGetterParams<MulticlasserRow, number>
      ) => `#${params.value}`,
    },
    {
      field: "total_score",
      headerName: "Score",
      width: options.mobile ? 90 : 105,
      renderCell: (params: GridRenderCellParams<MulticlasserRow, number>) => (
        <ScoreCell {...params} spotCounts={options.spotCounts} />
      ),
    },
    {
      field: "main",
      headerName: "Main",
      width: options.mobile ? 160 : 240,
      valueFormatter: (
        params: GridValueGetterParams<MulticlasserRow, MulticlasserRow["main"]>
      ) => {
        if (!params.value) {
          return "Unknown";
        }
        return capitalizeFirstLetter(
          `${params.value.name}-${params.value.realm}`
        );
      },
      renderCell: (
        params: GridRenderCellParams<MulticlasserRow, MulticlasserRow["main"]>
      ) => {
        if (!params.value) {
          return <span className="text-gray-400">Unknown</span>;
        }
        const enriched = {
          ...params.value,
          region,
        };
        const url = getAltProfileUrl(enriched);

        return (
          <div className="flex items-center justify-between w-full overflow-hidden">
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={url}
              className="text-sm no-underline flex items-baseline gap-1.5 overflow-hidden"
              style={{ textDecoration: "none" }}
            >
              <span
                className="truncate"
                style={{
                  color: getClassNameColor(params.value.class),
                  fontWeight: 600,
                  fontSize: "0.95rem",
                }}
              >
                {params.value.name}
              </span>
              <span
                className="truncate shrink-0"
                style={{
                  color: "#94a3b8",
                  fontSize: "0.75rem",
                  fontWeight: 400,
                }}
              >
                {params.value.realm}
              </span>
            </a>
            {!options.mobile && (
              <GearCell main={params.value} region={region} />
            )}
          </div>
        );
      },
    },
    {
      field: "specs",
      headerName: "Specs",
      flex: 1,
      minWidth: options.specMinWidth,
      valueFormatter: (
        params: GridValueGetterParams<MulticlasserRow, MulticlasserRow["specs"]>
      ) => {
        const specValue = params.value ?? {};
        return Object.keys(specValue)
          .map((key) => `${key}: ${specValue[key].score}`)
          .join(", ");
      },
      renderCell: (
        params: GridRenderCellParams<MulticlasserRow, MulticlasserRow["specs"]>
      ) => {
        const specValue = params.value ?? {};
        const keys = Object.keys(specValue);
        keys.sort((a, b) => specValue[b].score - specValue[a].score);
        const computedWidth =
          params.colDef.computedWidth ?? options.specMinWidth;
        const gapPx = options.mobile ? 4 : 6;
        const estimateChipWidth = (key: string) => {
          const pos = specValue[key].rank_without_alts;
          const digits = `${pos}`.length;
          const base = options.mobile ? 46 : 56;
          return base + digits * 6;
        };
        const plusWidth = options.mobile ? 32 : 40;

        const trimmedKeys: string[] = [];
        let used = 0;

        for (let i = 0; i < keys.length; i++) {
          const remaining = keys.length - (i + 1);
          const chipWidth = estimateChipWidth(keys[i]);
          const reserved = remaining > 0 ? plusWidth : 0;
          if (
            trimmedKeys.length < options.maxSpecChips &&
            used + chipWidth + reserved <= computedWidth
          ) {
            trimmedKeys.push(keys[i]);
            used += chipWidth + gapPx;
          } else {
            break;
          }
        }

        const hiddenCount = keys.length - trimmedKeys.length;
        return (
          <div className="mclass-spec-row">
            {trimmedKeys.map((key) => {
              const specIcon = getSpecIcon(key);
              const ratingColor = ratingToColor(
                specValue[key].character.rating,
                specValue[key].character.in_cutoff
              );
              return (
                <div
                  key={key}
                  className="mclass-spec-chip"
                  style={{ borderColor: ratingColor, color: ratingColor }}
                >
                  <img
                    src={specIcon}
                    alt={`${key} icon`}
                    className="mclass-spec-chip__icon"
                  />
                  <span className="mclass-spec-chip__rank">
                    #{specValue[key].rank_without_alts}
                  </span>
                </div>
              );
            })}
            {hiddenCount > 0 && (
              <div className="mclass-spec-chip mclass-spec-chip--more">
                +{hiddenCount}
              </div>
            )}
          </div>
        );
      },
    },
  ];
}

function MClassLeaderboard() {
  const { region: regionFromUrl } = useParams();
  const region = getRegion(regionFromUrl);
  const isTablet = useMediaQuery("(max-width:1024px)");
  const isMobile = useMediaQuery("(max-width:640px)");
  const [role, setRole] = React.useState("all");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [rowsToShow, setRowsToShow] = React.useState<MulticlasserRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [spotCounts, setSpotCounts] = React.useState<SpotCounts>({});
  const [hoveredRow, setHoveredRow] = React.useState<MulticlasserRow | null>(
    null
  );

  const NoRowsOverlay = () => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#cbd5e1",
        fontSize: 14,
        textAlign: "center",
        px: 3,
      }}
    >
      No data yet — the leaderboard is updating. Please try again shortly.
    </Box>
  );

  // Fetch stats for spot counts (without alts for ladder size estimation)
  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchBracketActivity(region as REGION);
        const counts = data?.cutoffs?.spotWithNoAlts ?? {};
        setSpotCounts(counts);
      } catch (error) {
        console.error("Failed to load stats", error);
      }
    };
    loadStats();
  }, [region]);

  const getLeaderboard = React.useCallback(
    async (
      selectedRegion: REGION,
      selectedRole: string,
      requestedPage: number
    ) => {
      setLoading(true);
      try {
        const dt = await getMulticlasserLeaderboard(
          selectedRegion,
          selectedRole,
          requestedPage
        );
        const resultRows =
          (dt?.multiclassers as MulticlasserRow[] | undefined) ?? [];
        setRowsToShow(resultRows);
        setTotalPages(dt?.total_pages ?? 1);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Failed to load multiclass leaderboard", error);
        setRowsToShow([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  React.useEffect(() => {
    getLeaderboard(region as REGION, role, page);
  }, [region, role, page, getLeaderboard]);

  const pagination = (
    <Pagination
      boundaryCount={1}
      count={totalPages}
      page={page}
      onChange={(e, p) => setPage(p)}
      color="primary"
      shape="rounded"
      sx={{
        "& .MuiPaginationItem-root": {
          borderRadius: "12px",
          color: "#cbd5f5",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          backgroundColor: "rgba(15, 23, 42, 0.45)",
        },
        "& .Mui-selected": {
          backgroundColor: "rgba(59, 130, 246, 0.35) !important",
          borderColor: "rgba(59, 130, 246, 0.6)",
        },
      }}
    />
  );

  const containerHeight =
    loading || rowsToShow.length === 0 ? `${TABLE_MIN_HEIGHT}px` : "auto";
  const isEmptyState = !loading && rowsToShow.length === 0;

  const specColumnOptions = React.useMemo<ColumnOptions>(() => {
    if (isMobile) {
      return { maxSpecChips: 2, specMinWidth: 140, mobile: true, spotCounts };
    }
    if (isTablet) {
      return { maxSpecChips: 4, specMinWidth: 220, mobile: false, spotCounts };
    }
    return {
      maxSpecChips: DEFAULT_MAX_SPEC_CHIPS,
      specMinWidth: 320,
      mobile: false,
      spotCounts,
    };
  }, [isMobile, isTablet, spotCounts]);

  const tableColumns = React.useMemo(
    () => columns(region as REGION, specColumnOptions),
    [region, specColumnOptions]
  );

  const handleCellEnter = React.useCallback((params: GridCellParams) => {
    setHoveredRow(params?.row as MulticlasserRow);
  }, []);

  const handleCellLeave = React.useCallback(() => {
    setHoveredRow(null);
  }, []);

  const gridHoverProps = React.useMemo(
    () => ({
      onCellMouseEnter: handleCellEnter,
      onCellMouseLeave: handleCellLeave,
    }),
    [handleCellEnter, handleCellLeave]
  );

  return (
    <div className="mclass-page">
      <div className="mclass-orb mclass-orb--one" />
      <div className="mclass-orb mclass-orb--two" />
      <div className="mclass-grid-overlay" />
      <div className="mclass-container">
        {/* Header with Scoring Info */}
        <section className="mclass-card mclass-header-expanded">
          <div className="mclass-header-main">
            <div className="mclass-header-left">
              <Tooltip
                title="Ratings/ranks refresh about every ~3 hours on average (not live)."
                placement="bottom-start"
              >
                <div className="mclass-badge mclass-badge--refresh">
                  <AccessTimeIcon className="mclass-badge-icon" />
                  Updates ~3h
                </div>
              </Tooltip>
              <div className="mclass-header-titles">
                <Typography
                  variant="h4"
                  className="mclass-header-title"
                  component="h1"
                >
                  Shuffle Multiclassers
                  <span className="mclass-header-region">
                    {region?.toUpperCase()}
                  </span>
                </Typography>
                <Typography variant="body2" className="mclass-header-subtitle">
                  Ranking players who excel at multiple specs • Click a score
                  or (i) for details
                </Typography>
              </div>
            </div>
          </div>

          <div className="mclass-scoring-section">
            <div className="mclass-scoring-intro">
              <p>
                <strong>How scoring works:</strong> For each spec, we use your{" "}
                <strong>Rank Without Alts</strong>, estimate ladder size as{" "}
                <strong>R1 spots × 1000</strong>, convert your rank to a
                percentile, then award points from the tiers below (linear
                within each tier). Tank specs are scaled to 40% (max 400).
              </p>
              <p>
                <strong>Updates:</strong> Ratings/ranks aren’t live — this page
                refreshes about every ~3 hours on average (heavy computation),
                so recent games may take a bit to show up.
              </p>
              <p>
                <strong>Want the exact breakdown?</strong> Click any score (or
                the <strong>(i)</strong> button) to see how each spec and the
                total were computed.
              </p>
            </div>

            <div className="mclass-scoring-tiers-section">
              <div className="mclass-scoring-tiers-header">
                <span className="mclass-scoring-title">
                  Percentile → Points
                </span>
                <div className="mclass-max-badges">
                  <div className="mclass-max-badge mclass-max-badge--dps">
                    <span className="mclass-max-badge__label">Max</span>
                    <span className="mclass-max-badge__value">1000</span>
                  </div>
                  <div className="mclass-max-badge mclass-max-badge--tank">
                    <SecurityIcon className="mclass-max-badge__icon" />
                    <span className="mclass-max-badge__label">Tank</span>
                    <span className="mclass-max-badge__value">400</span>
                  </div>
                </div>
              </div>

              <div className="mclass-scoring-tiers">
                {SCORING_RULES_UI.map((rule, index) => {
                  const isTop = index === 0;
                  const isLow = index >= 5;
                  return (
                    <div
                      key={rule.percentile}
                      className={`mclass-scoring-tier ${isTop ? "mclass-scoring-tier--top" : ""
                        } ${isLow ? "mclass-scoring-tier--low" : ""}`}
                    >
                      <span className="mclass-scoring-tier__percentile">
                        {rule.percentile}
                      </span>
                      <span className="mclass-scoring-tier__score">
                        {rule.score}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mclass-card mclass-table-card">
          <div className="mclass-table-header">
            <Tabs
              value={role}
              onChange={(event: React.SyntheticEvent, newValue: string) => {
                setRole(newValue);
              }}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              aria-label="Role filter tabs"
              sx={{
                minHeight: 48,
                "& .MuiTabs-scrollButtons": {
                  color: "#cbd5f5",
                },
                "& .MuiTabs-indicator": {
                  height: 4,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, #22d3ee 0%, #a855f7 50%, #f472b6 100%)",
                },
              }}
            >
              {roleFilters.map(
                ({ value: tabValue, label, icon: Icon, accentClass }) => (
                  <Tab
                    key={tabValue}
                    value={tabValue}
                    className="mclass-tab"
                    aria-label={label}
                    disableRipple
                    label={
                      <span className="mclass-tab-label">
                        <span className={`mclass-tab-icon ${accentClass}`}>
                          <Icon fontSize="small" />
                        </span>
                        {label}
                      </span>
                    }
                  />
                )
              )}
            </Tabs>
            <div className="mclass-pagination-desktop">{pagination}</div>
          </div>
          {!isEmptyState && (
            <div className="mclass-table-shell">
              {loading ? (
                <div className="mclass-table-skeleton" aria-hidden={true}>
                  {Array.from({ length: SKELETON_ROW_COUNT }).map(
                    (_, index) => (
                      <div key={index} className="mclass-skeleton-row" />
                    )
                  )}
                </div>
              ) : (
                <>
                  <Box
                    sx={{
                      width: "100%",
                      minHeight: `${TABLE_MIN_HEIGHT}px`,
                      overflowX: isMobile ? "auto" : "visible",
                      "& .MuiDataGrid-main": {
                        minWidth: isMobile ? 520 : "auto",
                      },
                    }}
                  >
                    <StripedDataGrid
                      autoHeight
                      rows={rowsToShow}
                      getRowId={(row) => row.rank}
                      columns={tableColumns}
                      disableColumnMenu
                      hideFooter
                      sx={{
                        "&, [class^=MuiDataGrid]": { border: "none" },
                        "& .MuiDataGrid-columnHeaders": {
                          backgroundColor: "rgba(15, 23, 42, 0.95)",
                          color: "#e2e8f0",
                          fontSize: 13,
                          letterSpacing: "0.05em",
                        },
                        "& .MuiDataGrid-cell": {
                          color: "#e2e8f0",
                          borderBottom: "1px solid rgba(148, 163, 184, 0.08)",
                        },
                        "& .MuiDataGrid-virtualScroller": {
                          backgroundColor: "transparent",
                        },
                        "& .MuiDataGrid-columnSeparator": {
                          display: "none",
                        },
                      }}
                      initialState={{
                        pagination: {
                          paginationModel: {
                            pageSize: 100,
                          },
                        },
                        sorting: {
                          sortModel: [{ field: "total_score", sort: "desc" }],
                        },
                      }}
                      pageSizeOptions={[100]}
                      rowHeight={36}
                      disableRowSelectionOnClick
                      slots={{ noRowsOverlay: NoRowsOverlay }}
                      getRowClassName={(params) =>
                        params.indexRelativeToCurrentPage % 2 === 0
                          ? "even"
                          : "odd"
                      }
                      {...(gridHoverProps as Record<string, unknown>)}
                    />
                  </Box>
                  {hoveredRow && (
                    <div className="mclass-hover-pane">
                      <div>
                        <span className="mclass-hover-label">Player</span>
                        <span>
                          {capitalizeFirstLetter(
                            `${hoveredRow.main?.name ?? ""}-${hoveredRow.main?.realm ?? ""
                            }`
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="mclass-hover-label">Score</span>
                        <span>{hoveredRow.total_score}</span>
                      </div>
                      {hoveredRow.scoring_tier && (
                        <div>
                          <span className="mclass-hover-label">Tier</span>
                          <span className="mclass-hover-tier">
                            {hoveredRow.scoring_tier}
                          </span>
                        </div>
                      )}
                      {hoveredRow.percentile != null && (
                        <div>
                          <span className="mclass-hover-label">Percentile</span>
                          <span>{hoveredRow.percentile.toFixed(2)}%</span>
                        </div>
                      )}
                      <div>
                        <span className="mclass-hover-label">Specs</span>
                        <span>
                          {Object.keys(hoveredRow.specs ?? {}).length}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {isEmptyState && (
            <div className="mclass-empty">
              {/* Animated calculating illustration */}
              <div className="mclass-empty__illustration">
                <div className="mclass-empty__chart">
                  <div className="mclass-empty__bar mclass-empty__bar--1" />
                  <div className="mclass-empty__bar mclass-empty__bar--2" />
                  <div className="mclass-empty__bar mclass-empty__bar--3" />
                  <div className="mclass-empty__bar mclass-empty__bar--4" />
                  <div className="mclass-empty__bar mclass-empty__bar--5" />
                </div>
                <div className="mclass-empty__gears">
                  <div className="mclass-empty__gear mclass-empty__gear--large">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                    </svg>
                  </div>
                  <div className="mclass-empty__gear mclass-empty__gear--small">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12 3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" />
                    </svg>
                  </div>
                </div>
                <div className="mclass-empty__pulse-ring" />
                <div className="mclass-empty__pulse-ring mclass-empty__pulse-ring--delayed" />
              </div>

              <div className="mclass-empty__content">
                <div className="mclass-empty__badge">
                  <span className="mclass-empty__badge-dot" />
                  Calculating
                </div>
                <Typography variant="h5" className="mclass-empty__title">
                  Leaderboard Updating
                </Typography>
                <Typography variant="body2" className="mclass-empty__subtitle">
                  No rows yet — we’re refreshing the ladder data and
                  recalculating scores. Please check back in a few minutes.
                </Typography>
                <div className="mclass-empty__info">
                  <div className="mclass-empty__info-item">
                    <span className="mclass-empty__info-icon">📊</span>
                    <span>Fetching ladder positions</span>
                  </div>
                  <div className="mclass-empty__info-item">
                    <span className="mclass-empty__info-icon">🧮</span>
                    <span>Computing percentile scores</span>
                  </div>
                  <div className="mclass-empty__info-item">
                    <span className="mclass-empty__info-icon">🏆</span>
                    <span>Ranking multiclassers</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mclass-pagination-mobile">{pagination}</div>
        </section>
      </div>
    </div>
  );
}

export default MClassLeaderboard;
