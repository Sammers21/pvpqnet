import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import type { Player, EquippedItem, PvpTalent } from "@/types";
import {
  getEquipment,
  fetchSpellIcon,
  getTalents,
  getProfile,
} from "@/services/stats.service";
import { getClassNameColor, getSpecIcon } from "@/utils/table";
import otherBg from "@/assets/racebg/otherbg.webp";
import nelfBg from "@/assets/racebg/nelf.webp";

const RACE_BACKGROUNDS: Record<string, string> = {
  "Night Elf": nelfBg,
};

interface GearModalProps {
  player: Player;
  open: boolean;
  onClose: () => void;
  initialTab?: number;
}

// Quality color mapping
const qualityColors: Record<string, string> = {
  POOR: "#9d9d9d",
  COMMON: "#ffffff",
  UNCOMMON: "#1eff00",
  RARE: "#0070dd",
  EPIC: "#a335ee",
  LEGENDARY: "#ff8000",
  ARTIFACT: "#e6cc80",
  HEIRLOOM: "#00ccff",
};

// Slot order for paper doll layout
const LEFT_SLOTS = [
  "HEAD",
  "NECK",
  "SHOULDER",
  "BACK",
  "CHEST",
  "SHIRT",
  "TABARD",
  "WRIST",
];
const RIGHT_SLOTS = [
  "HANDS",
  "WAIST",
  "LEGS",
  "FEET",
  "FINGER_1",
  "FINGER_2",
  "TRINKET_1",
  "TRINKET_2",
];
const BOTTOM_SLOTS = ["MAIN_HAND", "OFF_HAND"];

const SLOT_NAMES: Record<string, string> = {
  HEAD: "Head",
  NECK: "Neck",
  SHOULDER: "Shoulders",
  BACK: "Back",
  CHEST: "Chest",
  SHIRT: "Shirt",
  TABARD: "Tabard",
  WRIST: "Wrist",
  HANDS: "Hands",
  WAIST: "Waist",
  LEGS: "Legs",
  FEET: "Feet",
  FINGER_1: "Ring 1",
  FINGER_2: "Ring 2",
  TRINKET_1: "Trinket 1",
  TRINKET_2: "Trinket 2",
  MAIN_HAND: "Main Hand",
  OFF_HAND: "Off Hand",
};

// Generate Wowhead link with bonus IDs, gems, and enchants
const getWowheadLink = (item: EquippedItem): string => {
  let link = `https://www.wowhead.com/item=${item.itemId}`;
  const params: string[] = [];

  if (item.bonusList?.length > 0) {
    params.push(`bonus=${item.bonusList.join(":")}`);
  }

  const gemIds = item.sockets
    ?.filter((s) => s.gemId)
    .map((s) => s.gemId)
    .filter(Boolean);
  if (gemIds?.length > 0) {
    params.push(`gems=${gemIds.join(":")}`);
  }

  if (item.enchantments?.length > 0) {
    params.push(`ench=${item.enchantments[0].enchantmentId}`);
  }

  if (params.length > 0) {
    link += "?" + params.join("&");
  }

  return link;
};

// Secondary stat type display names and colors
const STAT_DISPLAY: Record<
  string,
  { name: string; color: string; abbr: string }
> = {
  CRIT_RATING: { name: "Critical Strike", color: "#ef4444", abbr: "Crit" },
  HASTE_RATING: { name: "Haste", color: "#fbbf24", abbr: "Haste" },
  MASTERY_RATING: { name: "Mastery", color: "#a855f7", abbr: "Mast" },
  VERSATILITY: { name: "Versatility", color: "#22c55e", abbr: "Vers" },
  INTELLECT: { name: "Intellect", color: "#60A5FA", abbr: "Int" },
  AGILITY: { name: "Agility", color: "#60A5FA", abbr: "Agi" },
  STRENGTH: { name: "Strength", color: "#60A5FA", abbr: "Str" },
  STAMINA: { name: "Stamina", color: "#9ca3af", abbr: "Stam" },
};

// Secondary stat types to show on item cards
const SECONDARY_STATS = [
  "CRIT_RATING",
  "HASTE_RATING",
  "MASTERY_RATING",
  "VERSATILITY",
];

// Parse item level from tooltip HTML
const parseBaseIlvlFromTooltip = (
  tooltip: string | undefined
): number | null => {
  if (!tooltip) return null;
  const match = tooltip.match(/Item Level\s*<!--ilvl-->(\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

// Parse PvP minimum item level from tooltip HTML
const parsePvpMinIlvlFromTooltip = (
  tooltip: string | undefined
): number | null => {
  if (!tooltip) return null;
  const match = tooltip.match(/Increases item level to a minimum of (\d+)/i);
  return match ? parseInt(match[1], 10) : null;
};

// Helpers for item level rules
const isCompetitorItem = (item: EquippedItem): boolean =>
  item.name?.toLowerCase().includes("competitor's") ?? false;

const isTwoHanded = (item?: EquippedItem): boolean => {
  if (!item) return false;
  const text = `${item.tooltip || ""} ${item.name || ""}`.toLowerCase();
  return text.includes("two-hand") || text.includes("two handed");
};

const baseIlvlWithMinRule = (item: EquippedItem): number => {
  // Start from the displayed itemLevel; never go below it
  const parsedBase = parseBaseIlvlFromTooltip(item.tooltip);
  const baseIlvl = Math.max(item.itemLevel, parsedBase ?? item.itemLevel);
  const pvpMinIlvl = parsePvpMinIlvlFromTooltip(item.tooltip);
  if (pvpMinIlvl !== null && pvpMinIlvl > baseIlvl) {
    return pvpMinIlvl;
  }
  return baseIlvl;
};

// Check if the item was scaled up for PvP
const wasItemScaledForPvp = (item: EquippedItem): boolean => {
  const baseIlvl = parseBaseIlvlFromTooltip(item.tooltip) ?? item.itemLevel;
  const pvpMinIlvl = parsePvpMinIlvlFromTooltip(item.tooltip);

  return pvpMinIlvl !== null && pvpMinIlvl > baseIlvl;
};

// Item component with Wowhead tooltip
type EquippedItemWithEffective = EquippedItem & { effectiveIlvl?: number };

const buildWowheadDataAttr = (item: EquippedItemWithEffective): string => {
  const parts: string[] = [`item=${item.itemId}`];
  if (item.bonusList?.length) {
    parts.push(`bonus=${item.bonusList.join(":")}`);
  }
  const gemIds = item.sockets
    ?.filter((s) => s.gemId)
    .map((s) => s.gemId)
    .filter(Boolean);
  if (gemIds?.length) {
    parts.push(`gems=${gemIds.join(":")}`);
  }
  if (item.enchantments?.length) {
    parts.push(`ench=${item.enchantments[0].enchantmentId}`);
  }
  return parts.join("&");
};

const getItemIconUrl = (
  item?: EquippedItemWithEffective
): string | undefined => {
  if (!item) return undefined;
  // Icon URL is now fetched from Wowhead and stored directly on the item
  return item.icon;
};

const EMPTY_SLOT_ICONS: Record<string, string> = {
  HEAD: "inventoryslot_head",
  NECK: "inventoryslot_neck",
  SHOULDER: "inventoryslot_shoulder",
  BACK: "inventoryslot_chest",
  CHEST: "inventoryslot_chest",
  SHIRT: "inventoryslot_shirt",
  TABARD: "inventoryslot_tabard",
  WRIST: "inventoryslot_wrists",
  HANDS: "inventoryslot_hands",
  WAIST: "inventoryslot_waist",
  LEGS: "inventoryslot_legs",
  FEET: "inventoryslot_feet",
  FINGER_1: "inventoryslot_finger",
  FINGER_2: "inventoryslot_finger",
  TRINKET_1: "inventoryslot_trinket",
  TRINKET_2: "inventoryslot_trinket",
  MAIN_HAND: "inventoryslot_mainhand",
  OFF_HAND: "inventoryslot_offhand",
};

// Helper to get gem icon URL
const getGemIconUrl = (socket: {
  gemId?: number;
  icon?: string;
}): string | undefined => {
  if (!socket.icon) return undefined;
  if (socket.icon.startsWith("http")) return socket.icon;
  return `https://wow.zamimg.com/images/wow/icons/small/${socket.icon}.jpg`;
};

const ItemSlot = ({
  item,
  slotName,
  slotKey,
  align = "left",
}: {
  item?: EquippedItemWithEffective;
  slotName: string;
  slotKey: string;
  align?: "left" | "right";
}) => {
  const isLeft = align === "left";
  if (!item) {
    const emptyIcon = `https://wow.zamimg.com/images/wow/icons/large/${
      EMPTY_SLOT_ICONS[slotKey] || "inventoryslot_chest"
    }.jpg`;
    return (
      <div
        className={`flex items-center w-full py-0 ${
          isLeft ? "justify-start" : "justify-end"
        }`}
      >
        <div
          className="relative shrink-0 opacity-40 border-2 border-[#374151] bg-black/80"
          style={{ width: 52, height: 52 }}
        >
          <img
            src={emptyIcon}
            alt={slotName}
            className="w-full h-full object-cover grayscale rounded-sm"
          />
        </div>
      </div>
    );
  }
  const qualityColor = qualityColors[item.quality] || qualityColors.COMMON;
  const iconUrl = getItemIconUrl(item);
  const gems = item.sockets?.filter((s) => s.gemId) || [];
  const enchant = item.enchantments?.[0];
  const itemLevel = item.effectiveIlvl ?? item.itemLevel;
  // Icon element - 52px icon with quality border
  const iconElement = (
    <a
      href={getWowheadLink(item)}
      target="_blank"
      rel="noopener noreferrer"
      data-wowhead={buildWowheadDataAttr(item)}
      className="relative block shrink-0 transition-all duration-200 hover:shadow-[0_0_12px_var(--glow-color)] [&_.iconsmall]:!hidden"
      style={
        {
          width: 52,
          height: 52,
          borderWidth: 2,
          borderStyle: "solid",
          borderColor: qualityColor,
          "--glow-color": qualityColor,
        } as React.CSSProperties
      }
    >
      <div className="relative w-full h-full bg-black/80">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={item.name}
            className="w-full h-full object-cover rounded-sm"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#94a3b8] text-xs">
            ERROR {slotName}
          </div>
        )}
      </div>
    </a>
  );
  // Item info element - simplified
  const infoElement = (
    <div
      className={`flex flex-col min-w-0 ${
        isLeft ? "items-start text-left" : "items-end text-right"
      }`}
    >
      {/* Item name */}
      <p
        className="text-[13px] font-medium truncate max-w-[170px] leading-tight"
        style={{ color: qualityColor }}
      >
        {item.name}
      </p>
      {/* Item level + gems row */}
      <div
        className={`flex items-center gap-1.5 ${
          isLeft ? "justify-start" : "justify-end"
        }`}
      >
        <span
          className="text-[13px] font-medium"
          style={{ color: qualityColor }}
        >
          {itemLevel}
        </span>
        {/* Gem icons with gradient border */}
        {gems.map((gem, idx) => (
          <a
            key={idx}
            href={`https://www.wowhead.com/item=${gem.gemId}`}
            target="_blank"
            rel="noopener noreferrer"
            data-wowhead={`item=${gem.gemId}`}
            className="block [&_.iconsmall]:!hidden"
          >
            <img
              src={
                getGemIconUrl(gem) ||
                "https://wow.zamimg.com/images/wow/icons/small/inv_misc_gem_01.jpg"
              }
              alt="gem"
              className="w-[18px] h-[18px] bg-gradient-to-br from-[#FEFF43] via-[#E426FF] to-[#64FF35] p-[1px] rounded-[2px]"
            />
          </a>
        ))}
      </div>
      {/* Enchant text */}
      {enchant && enchant.displayString && (
        <span className="text-[#22c55e] text-[11px] leading-tight truncate max-w-[170px]">
          {enchant.displayString
            .replace(/Enchanted:\s*/i, "")
            .replace(/\|A:[^|]+\|a/g, "")
            .trim()}
        </span>
      )}
    </div>
  );
  return (
    <div
      className={`flex items-center gap-2 w-full py-0 ${
        isLeft ? "justify-start" : "justify-end"
      }`}
    >
      {isLeft ? (
        <>
          {iconElement}
          {infoElement}
        </>
      ) : (
        <>
          {infoElement}
          {iconElement}
        </>
      )}
    </div>
  );
};

// PvP Talent component
const PvpTalentItem = ({ talent }: { talent: PvpTalent }) => {
  const [iconUrl, setIconUrl] = useState<string | undefined>(undefined);
  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const tryExtractFromDom = (): boolean => {
      if (!anchorRef.current) return false;
      const iconsmall = anchorRef.current.querySelector(
        '.iconsmall[data-game="wow"][data-type="spell"]'
      ) as HTMLElement | null;
      if (!iconsmall) return false;

      const ins = iconsmall.querySelector("ins") as HTMLElement | null;
      if (!ins) return false;

      const bg =
        ins.style.backgroundImage ||
        window.getComputedStyle(ins).backgroundImage;
      const match =
        typeof bg === "string" ? bg.match(/url\(["']?(.*?)["']?\)/) : null;

      if (match && match[1]) {
        const url = match[1].replace("/medium/", "/large/");
        setIconUrl(url);
        iconsmall.remove();
        return true;
      }
      return false;
    };

    (async () => {
      try {
        const icon = await fetchSpellIcon(talent.spellId);
        if (mounted && icon) {
          setIconUrl(icon);
          return;
        }
      } catch (err) {
        // ignore
      }

      const maxRetries = 10;
      const delay = 200;
      let tries = 0;
      while (mounted && tries < maxRetries) {
        const found = tryExtractFromDom();
        if (found) break;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
        tries++;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [talent.spellId]);

  return (
    <a
      ref={anchorRef}
      href={`https://www.wowhead.com/spell=${talent.spellId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 p-1.5 rounded-lg hover:bg-[#1a1f2e] transition-colors duration-200 no-underline [&_.iconsmall]:!hidden"
      data-wowhead={`spell=${talent.spellId}`}
    >
      <div className="relative shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-[#374151] group-hover:border-[#FFB100] transition-colors">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={talent.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1f2e]">
            <span className="text-[#60A5FA] text-lg opacity-50">⚔️</span>
          </div>
        )}
      </div>
      <span className="text-[#FFB100] text-base sm:text-lg font-medium group-hover:brightness-125 transition-all">
        {talent.name}
      </span>
    </a>
  );
};

const PvpTalentBadge = ({ talent }: { talent: PvpTalent }) => {
  const [iconUrl, setIconUrl] = useState<string | undefined>(undefined);
  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const tryExtractFromDom = (): boolean => {
      if (!anchorRef.current) return false;
      const iconsmall = anchorRef.current.querySelector(
        '.iconsmall[data-game="wow"][data-type="spell"]'
      ) as HTMLElement | null;
      if (!iconsmall) return false;
      const ins = iconsmall.querySelector("ins") as HTMLElement | null;
      if (!ins) return false;
      const bg =
        ins.style.backgroundImage ||
        window.getComputedStyle(ins).backgroundImage;
      const match =
        typeof bg === "string" ? bg.match(/url\(["']?(.*?)["']?\)/) : null;
      if (match && match[1]) {
        setIconUrl(match[1].replace("/medium/", "/large/"));
        iconsmall.remove();
        return true;
      }
      return false;
    };

    (async () => {
      try {
        const icon = await fetchSpellIcon(talent.spellId);
        if (mounted && icon) {
          setIconUrl(icon);
          return;
        }
      } catch {
        // ignore
      }

      const maxRetries = 10;
      const delay = 200;
      let tries = 0;
      while (mounted && tries < maxRetries) {
        const found = tryExtractFromDom();
        if (found) break;
        if (typeof window !== "undefined" && (window as any).$WowheadPower) {
          (window as any).$WowheadPower.refreshLinks();
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
        tries++;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [talent.spellId]);

  const hexStyle = {
    clipPath: "polygon(25% 3%, 75% 3%, 97% 50%, 75% 97%, 25% 97%, 3% 50%)",
  };

  return (
    <Tooltip title={talent.name} placement="top">
      <a
        ref={anchorRef}
        href={`https://www.wowhead.com/spell=${talent.spellId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
        data-wowhead={`spell=${talent.spellId}`}
      >
        <div className="relative w-10 h-10">
          <div
            className="absolute inset-0"
            style={{
              ...hexStyle,
              background: "#7a1111",
              boxShadow:
                "0 0 0 2px #b91c1c, 0 0 8px rgba(249,115,22,0.35), 0 0 14px rgba(185,28,28,0.35)",
            }}
          />
          <div
            className="absolute inset-[2px] overflow-hidden bg-[#0f172a]"
            style={hexStyle}
          >
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={talent.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#60A5FA] text-xs">
                ?
              </div>
            )}
          </div>
        </div>
      </a>
    </Tooltip>
  );
};

// Talents Tab Component
const TalentsTab = ({
  player,
  onCopySuccess,
}: {
  player: Player;
  onCopySuccess: () => void;
}) => {
  type SpecOption = {
    name: string;
    loadouts: { name: string; code: string }[];
    pvpTalents: PvpTalent[];
  };

  const initialLoadouts =
    player.loadouts?.map((l, idx) => ({
      name: `Loadout #${idx + 1}`,
      code: l.code,
    })) || [];

  const [activeLoadout, setActiveLoadout] = useState<string>(
    initialLoadouts[0]?.code || player.talents || ""
  );
  const [loadouts, setLoadouts] =
    useState<{ name: string; code: string }[]>(initialLoadouts);
  const [pvpTalents, setPvpTalents] = useState<PvpTalent[]>(
    player.pvpTalents || []
  );
  const [specOptions, setSpecOptions] = useState<SpecOption[]>([]);
  const [selectedSpec, setSelectedSpec] = useState<string>(player.activeSpec);
  const [viewportHeight, setViewportHeight] = useState<number>(800);

  useEffect(() => {
    const fetchTalents = async () => {
      const data = await getTalents(player.region, player.realm, player.name);
      if (data && data.specializations) {
        const mappedSpecs: SpecOption[] = data.specializations.map((s: any) => {
          const loadoutsArr =
            s.loadouts
              ?.filter((l: any) => l?.talent_loadout_code)
              .map((l: any, idx: number) => ({
                name: `Loadout #${idx + 1}`,
                code: l.talent_loadout_code,
              })) || [];

          const pvpList: PvpTalent[] =
            s.pvp_talent_slots
              ?.filter((slot: any) => slot.selected)
              .map((slot: any) => ({
                talentId: slot.selected.talent.id,
                name: slot.selected.talent.name,
                spellId: slot.selected.spell_tooltip.spell.id,
                description: slot.selected.spell_tooltip.description,
                castTime: slot.selected.spell_tooltip.cast_time,
                slotNumber: slot.slot_number,
              })) || [];

          return {
            name: s.specialization.name,
            loadouts: loadoutsArr,
            pvpTalents: pvpList,
          };
        });

        // Sort to put active spec first, then others
        const sortedSpecs = mappedSpecs.sort((a, b) => {
          if (a.name === player.activeSpec) return -1;
          if (b.name === player.activeSpec) return 1;
          return a.name.localeCompare(b.name);
        });

        setSpecOptions(sortedSpecs);
        const initialSpec =
          sortedSpecs.find((s) => s.name === selectedSpec) || sortedSpecs[0];
        if (initialSpec) {
          setSelectedSpec(initialSpec.name);
        }
      }
    };
    fetchTalents();
  }, [player]);

  useEffect(() => {
    if (
      pvpTalents.length > 0 &&
      typeof window !== "undefined" &&
      (window as any).$WowheadPower
    ) {
      try {
        (window as any).$WowheadPower.refreshLinks();
      } catch {
        // ignore
      }
    }
  }, [pvpTalents]);

  // When selected spec changes or options update, apply its loadouts and PvP talents
  useEffect(() => {
    const spec =
      specOptions.find((s) => s.name === selectedSpec) || specOptions[0];
    if (spec) {
      setLoadouts(spec.loadouts);
      setActiveLoadout(spec.loadouts[0]?.code || "");
      setPvpTalents(spec.pvpTalents);
    }
  }, [selectedSpec, specOptions]);

  useEffect(() => {
    const updateViewportHeight = () => {
      if (typeof window !== "undefined") {
        setViewportHeight(window.innerHeight);
      }
    };
    updateViewportHeight();
    if (typeof window !== "undefined") {
      window.addEventListener("resize", updateViewportHeight);
      return () => window.removeEventListener("resize", updateViewportHeight);
    }
    return () => {};
  }, []);

  const handleCopyLoadout = async () => {
    try {
      await navigator.clipboard.writeText(activeLoadout);
      onCopySuccess();
    } catch (err) {
      console.error("Failed to copy talent loadout:", err);
    }
  };

  const trimmedLoadout = (activeLoadout || "").trim();
  const wowheadTalentUrl = trimmedLoadout
    ? `https://www.wowhead.com/talent-calc/blizzard/${trimmedLoadout}`
    : "";
  const embedUrl = trimmedLoadout
    ? `https://www.wowhead.com/talent-calc/embed/blizzard/${trimmedLoadout}`
    : "";

  const talentsPanelHeight = Math.max(1000, Math.round(viewportHeight - 120));
  const iframeScale = 0.6;

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {specOptions && specOptions.length > 0 ? (
              specOptions.map((spec) => {
                const icon = getSpecIcon(`${spec.name} ${player.class}`);
                const isActive = spec.name === selectedSpec;
                return (
                  <button
                    key={spec.name}
                    onClick={() => setSelectedSpec(spec.name)}
                    className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg border transition-all duration-200 ${
                      isActive
                        ? "border-sky-400/70 bg-slate-800/70 shadow-[0_8px_24px_rgba(96,165,250,0.25)]"
                        : "border-slate-600/40 bg-slate-800/40 hover:border-sky-400/50 hover:bg-slate-800/60"
                    }`}
                    aria-pressed={isActive}
                  >
                    <img
                      src={icon}
                      alt={spec.name}
                      className="w-10 h-10 rounded-md border border-slate-600/60 bg-slate-900/60"
                    />
                    <span className="text-xs text-slate-200">{spec.name}</span>
                  </button>
                );
              })
            ) : (
              <span className="text-xs text-[#9ca3af]">No specs available</span>
            )}
          </div>

          <a
            href={wowheadTalentUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors no-underline ${
              wowheadTalentUrl
                ? "bg-[#f97316] hover:bg-[#ea580c] cursor-pointer"
                : "bg-[#4b5563] cursor-not-allowed opacity-70"
            }`}
            aria-disabled={!wowheadTalentUrl}
            onClick={(e) => {
              if (!wowheadTalentUrl) e.preventDefault();
            }}
          >
            <OpenInNewIcon sx={{ fontSize: 18 }} />
            Open on Wowhead
          </a>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#37415140] bg-[#1a1f2e]">
        {embedUrl ? (
          <div
            style={{
              transform: `scale(${iframeScale})`,
              transformOrigin: "top left",
              width: `${100 / iframeScale}%`,
              height: `${talentsPanelHeight / iframeScale}px`,
            }}
          >
            <iframe
              width="100%"
              height={talentsPanelHeight / iframeScale}
              src={embedUrl}
              style={{ border: "none", maxWidth: "100%", overflow: "hidden" }}
              title="Talent Tree"
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-full text-[#9ca3af] text-sm"
            style={{ height: talentsPanelHeight }}
          >
            No talent loadout available.
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel id="loadout-select-label" sx={{ color: "#9ca3af" }}>
              Loadouts
            </InputLabel>
            <Select
              labelId="loadout-select-label"
              value={activeLoadout}
              label="Loadouts"
              onChange={(e) => setActiveLoadout(e.target.value as string)}
              sx={{
                color: "#e5e7eb",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "#374151" },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#60A5FA",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#60A5FA",
                },
                ".MuiSvgIcon-root": { color: "#9ca3af" },
              }}
            >
              {loadouts && loadouts.length > 0 ? (
                loadouts.map((loadout, idx) => (
                  <MenuItem key={idx} value={loadout.code}>
                    {loadout.name || `Loadout #${idx + 1}`}
                  </MenuItem>
                ))
              ) : (
                <MenuItem value={activeLoadout || ""}>Default Loadout</MenuItem>
              )}
            </Select>
          </FormControl>

          <Tooltip title="Copy loadout code">
            <IconButton
              onClick={handleCopyLoadout}
              sx={{ color: "#9ca3af", "&:hover": { color: "#60A5FA" } }}
            >
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </div>

        <div className="flex-1 w-full flex justify-end">
          <div className="w-full md:w-auto flex items-center gap-3 flex-wrap justify-end">
            <span className="text-sm font-semibold text-[#e5e7eb] uppercase tracking-wide">
              PvP
            </span>
            {pvpTalents && pvpTalents.length > 0 ? (
              pvpTalents.map((talent) => (
                <PvpTalentBadge key={talent.talentId} talent={talent} />
              ))
            ) : (
              <div className="text-[#9ca3af] text-xs italic">
                No PvP talents found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Calculate stat priority from equipped items
const calculateStatPriority = (
  itemsBySlot: Record<string, EquippedItemWithEffective>
): { type: string; total: number }[] => {
  const statTotals: Record<string, number> = {};
  Object.values(itemsBySlot).forEach((item) => {
    item.stats?.forEach((stat) => {
      if (SECONDARY_STATS.includes(stat.type)) {
        statTotals[stat.type] = (statTotals[stat.type] || 0) + stat.value;
      }
    });
  });
  return Object.entries(statTotals)
    .map(([type, total]) => ({ type, total }))
    .sort((a, b) => b.total - a.total);
};

// Paper Doll Component
const PaperDoll = ({
  player,
  itemsBySlot,
  avgIlvl,
  uniqueSets,
}: {
  player: Player;
  itemsBySlot: Record<string, EquippedItemWithEffective>;
  avgIlvl: number;
  uniqueSets: string[];
}) => {
  const hideOffHand = isTwoHanded(itemsBySlot["MAIN_HAND"]);
  const bottomSlotsToRender = hideOffHand
    ? BOTTOM_SLOTS.filter((s) => s !== "OFF_HAND")
    : BOTTOM_SLOTS;
  const characterImage = player.media?.main_raw;
  const raceBg = RACE_BACKGROUNDS[player.race] || nelfBg;
  // Calculate stat priority
  const statPriority = calculateStatPriority(itemsBySlot);
  return (
    <div className="relative w-full max-w-[1200px] mx-auto p-1 md:p-2">
      {/* Background Image Container */}
      {raceBg && (
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden rounded-lg">
          <img
            src={raceBg}
            alt=""
            className="w-full h-full object-cover object-[center_75%] blur-[1px] scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f18] via-transparent to-[#0a0f18]" />
        </div>
      )}
      {/* Item Level & Stat Priority Bar */}
      <div className="flex items-center justify-center gap-3 mb-2 relative z-10 flex-wrap">
        {avgIlvl > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#9ca3af] text-sm">Item Level:</span>
            <span className="text-amber-400 text-base font-bold">
              {avgIlvl}
            </span>
          </div>
        )}
        {statPriority.length > 0 && avgIlvl > 0 && (
          <span className="text-[#4b5563]">|</span>
        )}
        {statPriority.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-[#9ca3af] text-sm">Stat Priority:</span>
            {statPriority.map((stat, idx) => (
              <span key={stat.type} className="flex items-center">
                <span
                  className="text-sm font-semibold"
                  style={{ color: STAT_DISPLAY[stat.type]?.color || "#9ca3af" }}
                >
                  {STAT_DISPLAY[stat.type]?.abbr || stat.type}
                </span>
                {idx < statPriority.length - 1 && (
                  <span className="text-[#4b5563] mx-1">{">"}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,300px)_1fr_minmax(260px,300px)] gap-1 relative min-h-[520px]">
        {/* Left Slots */}
        <div className="flex flex-col gap-0.5 z-10 justify-center">
          {LEFT_SLOTS.map((slot) => (
            <ItemSlot
              key={slot}
              item={itemsBySlot[slot]}
              slotName={SLOT_NAMES[slot]}
              slotKey={slot}
              align="left"
            />
          ))}
        </div>
        {/* Center Character - Only visible on large screens */}
        <div className="relative hidden lg:flex flex-col items-center justify-center">
          {/* Character Render */}
          {characterImage && (
            <div className="absolute inset-0 flex items-center justify-center -z-0">
              <img
                src={characterImage}
                alt={player.name}
                className="h-full w-auto object-contain max-w-[140%] scale-[1.1] translate-y-12"
                style={{
                  maskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, black 85%, transparent 100%)",
                  filter: "drop-shadow(0 0 20px rgba(0,0,0,0.5))",
                }}
              />
            </div>
          )}
        </div>
        {/* Right Slots */}
        <div className="flex flex-col gap-0.5 z-10 justify-center">
          {RIGHT_SLOTS.map((slot) => (
            <ItemSlot
              key={slot}
              item={itemsBySlot[slot]}
              slotName={SLOT_NAMES[slot]}
              slotKey={slot}
              align="right"
            />
          ))}
        </div>
        {/* Mobile View for Bottom Slots */}
        <div className="lg:hidden col-span-1 flex flex-col gap-0.5">
          {bottomSlotsToRender.map((slot) => (
            <ItemSlot
              key={slot}
              item={itemsBySlot[slot]}
              slotName={SLOT_NAMES[slot]}
              slotKey={slot}
              align="left"
            />
          ))}
        </div>
      </div>
      {/* Weapon Slots (Main Hand / Off Hand) - Below character for desktop */}
      <div className="hidden lg:flex justify-center gap-3 mt-1 relative z-10">
        {bottomSlotsToRender.map((slot) => (
          <div key={slot} className="w-[260px]">
            <ItemSlot
              item={itemsBySlot[slot]}
              slotName={SLOT_NAMES[slot]}
              slotKey={slot}
              align={slot === "OFF_HAND" ? "right" : "left"}
            />
          </div>
        ))}
      </div>
      {/* Set Bonuses */}
      {uniqueSets.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mt-3 z-10 relative">
          {uniqueSets.map((setDisplay, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full bg-[#fbbf2410] border border-[#fbbf2430] text-[#fbbf24] text-xs font-medium tracking-wide"
            >
              {setDisplay}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Main GearModal Component
const GearModal = ({
  player,
  open,
  onClose,
  initialTab = 0,
}: GearModalProps) => {
  const [activePlayer, setActivePlayer] = useState<Player>(player);
  const [equipment, setEquipment] = useState<EquippedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySnackbarOpen, setCopySnackbarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Sync activePlayer with player prop
  useEffect(() => {
    setActivePlayer(player);
  }, [player]);

  // Load full profile if media is missing
  useEffect(() => {
    const loadFullProfile = async () => {
      if (
        open &&
        !activePlayer.media &&
        activePlayer.name &&
        activePlayer.realm
      ) {
        try {
          const { player: fullProfile } = await getProfile(
            activePlayer.region,
            activePlayer.realm,
            activePlayer.name
          );
          if (fullProfile) {
            setActivePlayer((prev) => ({ ...prev, ...fullProfile }));
          }
        } catch (e) {
          console.error("Failed to load full profile for GearModal", e);
        }
      }
    };
    loadFullProfile();
  }, [
    open,
    activePlayer.media,
    activePlayer.name,
    activePlayer.realm,
    activePlayer.region,
  ]);

  // Sync activeTab with initialTab when open changes
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);

  const fetchEquipment = useCallback(async () => {
    if (!activePlayer || !open) return;

    setLoading(true);
    setError(null);

    try {
      const region =
        activePlayer.region === "en-gb"
          ? "eu"
          : activePlayer.region === "en-us"
          ? "us"
          : activePlayer.region;
      const items = await getEquipment(
        region,
        activePlayer.realm,
        activePlayer.name
      );
      setEquipment(items);
    } catch (err) {
      setError("Failed to load equipment");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activePlayer, open]);

  useEffect(() => {
    if (open) {
      fetchEquipment();
    }
  }, [open, fetchEquipment]);

  // Debug: log pvpTalents when modal opens for troubleshooting
  useEffect(() => {
    if (open) {
      try {
        // eslint-disable-next-line no-console
        console.debug(
          "GearModal opened - player.pvpTalents =",
          activePlayer?.pvpTalents
        );
        // eslint-disable-next-line no-console
        console.debug("GearModal opened - player.media =", activePlayer?.media);
      } catch (e) {
        // ignore
      }
    }
  }, [open, activePlayer]);

  // Refresh Wowhead tooltips after equipment loads
  useEffect(() => {
    if (!loading && equipment.length > 0) {
      const timer = setTimeout(() => {
        if (typeof window !== "undefined" && (window as any).$WowheadPower) {
          (window as any).$WowheadPower.refreshLinks();
        }
        if (
          typeof document !== "undefined" &&
          !document.getElementById("pvpqnet-wowhead-icon-style")
        ) {
          const style = document.createElement("style");
          style.id = "pvpqnet-wowhead-icon-style";
          style.innerHTML = `
            .iconsmall[data-game="wow"][data-type="spell"] {
              width: 48px !important;
              height: 48px !important;
              display: inline-block !important;
              margin: 0 !important;
              vertical-align: middle !important;
            }
            .iconsmall[data-game="wow"][data-type="spell"] ins {
              width: 100% !important;
              height: 100% !important;
              display: block !important;
              background-size: cover !important;
              background-position: center !important;
              border-radius: 6px !important;
            }
            .iconsmall[data-game="wow"][data-type="spell"] del { display: none !important; }
          `;
          document.head.appendChild(style);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, equipment]);

  const equipmentWithEffective: EquippedItemWithEffective[] = useMemo(() => {
    if (!equipment || equipment.length === 0) return [];

    const prelim = equipment.map((item) => ({
      item,
      baseWithMin: baseIlvlWithMinRule(item),
    }));

    const baseValues = prelim.map((p) => p.baseWithMin);
    const globalMax = baseValues.length > 0 ? Math.max(...baseValues) : 0;

    return prelim.map((p, idx) => {
      const { item, baseWithMin } = p;
      let effectiveIlvl = baseWithMin;
      if (isCompetitorItem(item)) {
        let maxOther = baseWithMin;
        if (prelim.length > 1) {
          const others = baseValues.filter((_, i) => i !== idx);
          if (others.length > 0) {
            maxOther = Math.max(...others);
          } else {
            maxOther = globalMax;
          }
        } else {
          maxOther = globalMax || baseWithMin;
        }
        effectiveIlvl = Math.max(baseWithMin, maxOther);
      }
      return { ...item, effectiveIlvl };
    });
  }, [equipment]);

  // Create a map of slot -> item
  const itemsBySlot = equipmentWithEffective.reduce((acc, item) => {
    acc[item.slot] = item;
    return acc;
  }, {} as Record<string, EquippedItemWithEffective>);

  // Calculate average PvP ilvl (effective) - excluding shirt and tabard
  const countableItems = equipmentWithEffective.filter(
    (item) => item.slot !== "SHIRT" && item.slot !== "TABARD"
  );
  const avgIlvl =
    countableItems.length > 0
      ? Math.round(
          countableItems.reduce(
            (sum, item) => sum + (item.effectiveIlvl ?? item.itemLevel),
            0
          ) / countableItems.length
        )
      : 0;

  // Find set items
  const setItems = equipmentWithEffective.filter((item) => item.setInfo);
  const uniqueSets = [
    ...new Set(setItems.map((item) => item.setInfo?.displayString)),
  ].filter(Boolean) as string[];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: "#0a0f18",
          backgroundImage: `linear-gradient(to bottom right, rgba(10, 15, 24, 0.75), rgba(3, 3, 3, 0.75)), url(${nelfBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid #37415180",
          borderRadius: "12px",
          maxHeight: "95vh",
          height: "90vh",
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
          <span
            className="text-xl font-bold"
            style={{ color: getClassNameColor(activePlayer.class) }}
          >
            {activePlayer.name}
          </span>
          <span className="text-[#9ca3af] text-sm">
            {activePlayer.activeSpec} {activePlayer.class}
          </span>
        </div>

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            "& .MuiTab-root": {
              color: "#9ca3af",
              textTransform: "none",
              fontSize: "1rem",
            },
            "& .Mui-selected": { color: "#60A5FA" },
            "& .MuiTabs-indicator": { backgroundColor: "#60A5FA" },
          }}
        >
          <Tab label="Gear" />
          <Tab label="Talents" />
        </Tabs>

        <IconButton onClick={onClose} sx={{ color: "#9ca3af" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, display: "flex", flexDirection: "column" }}>
        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <CircularProgress sx={{ color: "#60A5FA" }} />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center flex-1">
            <span className="text-[#ef4444]">{error}</span>
          </div>
        ) : (
          <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden", p: 1 }}>
            {activeTab === 0 && (
              <PaperDoll
                player={activePlayer}
                itemsBySlot={itemsBySlot}
                avgIlvl={avgIlvl}
                uniqueSets={uniqueSets}
              />
            )}

            {activeTab === 1 && (
              <TalentsTab
                player={activePlayer}
                onCopySuccess={() => setCopySnackbarOpen(true)}
              />
            )}
          </Box>
        )}
      </DialogContent>

      <Snackbar
        open={copySnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setCopySnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setCopySnackbarOpen(false)}
          severity="success"
          sx={{
            backgroundColor: "#030303e6",
            border: "1px solid #22c55e80",
            color: "#e5e7eb",
          }}
        >
          Talent loadout copied to clipboard!
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default GearModal;
