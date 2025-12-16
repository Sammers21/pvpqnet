import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { useMemo } from "react";
import { getSpecIcon } from "@/utils/table";
import { CLASS_AND_SPECS } from "@/constants/filterSchema";
ChartJS.register(
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// --- Visual constants ---
const ICON_SIZE = 18; // px (default, can be overridden per chart)
const ICON_PADDING = 35; // distance from outer radius (default, can be overridden per chart)
const GRID_COLOR = "rgba(55, 65, 81, 0.5)"; // tailwind gray-700 ~50%
const DATA_BG = "rgba(63, 106, 163, 0.73)"; // fill
const DATA_BORDER = "rgba(5, 113, 255, 0.73)"; // line

// --- Generic helpers ---
const isWithinRange = (ts: Date, start: Date, end: Date) =>
  ts >= start && ts <= end;
const safeLog = (value: number) => {
  if (!value || value <= 0) return 0;
  const v = Math.log2(value);
  return Number.isFinite(v) ? v : 0;
};
const sumGames = (won?: number, lost?: number) => (won ?? 0) + (lost ?? 0);

// Custom plugin to draw icons and optional labels at the ends of the radar axes.
// Expects `options.plugins.iconPlugin.images` to be an array of image URLs aligned with labels.
// Optional:
// - `options.plugins.iconPlugin.size` (number or {width,height})
// - `options.plugins.iconPlugin.padding` (number)
// - `options.plugins.iconPlugin.labelsUnderIcons` (string[])
// - `options.plugins.iconPlugin.labelColor` (string)
// - `options.plugins.iconPlugin.labelFont` (string canvas font)
// - `options.plugins.iconPlugin.labelOffset` (number px inward from icon center along radial)
const iconPlugin = {
  id: "iconPlugin",
  afterDraw: (chart) => {
    const pluginOpts = chart?.options?.plugins?.iconPlugin || {};
    const images = pluginOpts?.images || [];
    if (!images.length) return;
    if (!chart.ctx) return;
    const ctx = chart.ctx;
    const xCenter = chart.scales.r.xCenter;
    const yCenter = chart.scales.r.yCenter;
    const labelCount = chart.data.labels.length;
    const sizeOpt = pluginOpts?.size ?? ICON_SIZE;
    const sizeW =
      typeof sizeOpt === "number" ? sizeOpt : sizeOpt?.width ?? ICON_SIZE;
    const sizeH =
      typeof sizeOpt === "number" ? sizeOpt : sizeOpt?.height ?? ICON_SIZE;
    const cache = chart._iconCache || (chart._iconCache = new Map());
    // Extract chart layout padding to avoid drawing outside canvas
    chart.data.labels.forEach((_, index) => {
      const angle = Math.PI / 2 - (2 * Math.PI * index) / labelCount;
      // Do not exceed the available padding on either axis; also keep half the icon size inside canvas
      const radius = chart.scales.r.drawingArea + ICON_PADDING;
      const x = xCenter + Math.cos(angle) * radius - ICON_SIZE / 2;
      const y = yCenter - Math.sin(angle) * radius - ICON_SIZE / 2;
      let img: HTMLImageElement | undefined;
      const srcOrImg: any = images[index];
      if (srcOrImg instanceof HTMLImageElement) {
        img = srcOrImg;
      } else if (typeof srcOrImg === "string") {
        img = cache.get(srcOrImg);
        if (!img) {
          img = new Image();
          img.onload = () => {
            if (chart.ctx) chart.draw();
          };
          img.src = srcOrImg;
          cache.set(srcOrImg, img);
        }
      }
      // Draw icon
      if (img && img.complete) ctx.drawImage(img, x, y, sizeW, sizeH);

      const labels = pluginOpts?.labelsUnderIcons as string[] | undefined;
      if (labels && labels[index] != null) {
        const deg = (angle * 180) / Math.PI;
        const verticalOffset = pluginOpts?.labelOffset ?? 6;
        let textX = x + sizeW / 2;
        let textY;
        if (deg > 135 || deg < -135) {
          textY = y + sizeH + verticalOffset;
        } else if (deg === -90) {
          textY = y + sizeH - verticalOffset - 10;
        } else {
          textY = y + sizeH / 2 + 20;
        }
        ctx.save();
        ctx.globalAlpha = 1;
        ctx.font =
          pluginOpts?.labelFont ||
          "600 10px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const text = String(labels[index]);
        const metrics = ctx.measureText(text);
        const tw = metrics.width + 8;
        const th = 12;
        const rx = textX - tw / 2;
        const ry = textY - th / 2;
        const r = 10;
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.moveTo(rx + r, ry);
        ctx.arcTo(rx + tw, ry, rx + tw, ry + th, r);
        ctx.arcTo(rx + tw, ry + th, rx, ry + th, r);
        ctx.arcTo(rx, ry + th, rx, ry, r);
        ctx.arcTo(rx, ry, rx + tw, ry, r);
        ctx.closePath();
        ctx.fill();
        // Text
        ctx.fillStyle = pluginOpts?.labelColor || "#ffffff";
        ctx.fillText(text, textX, textY);
        ctx.restore();
      }
    });
  },
};
ChartJS.register(iconPlugin);

// Aggregate total games per spec within the selected year or current range
function getSpecStatisticPlayer(
  fullHistory: {
    item: {
      character: {
        full_spec: string;
        class: string;
        race: string;
        gender: string;
        name: string;
      };
      diff: { lost: number; won: number; timestamp: number };
    };
  },
  selectedYear,
  start,
  end,
  currentDate
) {
  const bySpec = new Map<string, number>();
  Object.values(fullHistory).forEach((item: any) => {
    if (!item?.character || item.character.full_spec === "{spec} {class}")
      return;
    const ts = new Date(item.diff.timestamp);
    const inSelectedYear = ts.getFullYear().toString() === selectedYear;
    const inCurrentRange =
      selectedYear === currentDate && isWithinRange(ts, start, end);
    if (!inSelectedYear && !inCurrentRange) return;
    const key = item.character.full_spec;
    bySpec.set(
      key,
      (bySpec.get(key) ?? 0) + sumGames(item.diff.won, item.diff.lost)
    );
  });

  return Array.from(bySpec.entries()).map(([specName, count]) => ({
    spec: getSpecIcon(specName),
    gamesAtSpec: { sum: count },
    name: specName,
  }));
}
function getBrackets(totalPlayers, selectedYear, start, end, currentDate) {
  let BracketObjects = [];
  totalPlayers.forEach((element) => {
    element.brackets.forEach(
      (item: {
        bracket_type: string;
        won: number;
        lost: number;
        gaming_history: {
          history: {
            session: { diff: { won: number; lost: number; timestamp: number } };
          };
        };
      }) => {
        let sum = 0;
        let won = 0;
        let lost = 0;
        Object.values(item.gaming_history.history).forEach((session) => {
          if (selectedYear === currentDate) {
            const ts = new Date(session.diff.timestamp);
            if (ts >= start && ts <= end) {
              won = session.diff.won ?? 0;
              lost = session.diff.lost ?? 0;
              sum = sum + won + lost;
            }
          } else if (
            selectedYear !== currentDate &&
            new Date(session.diff.timestamp).getFullYear().toString() ===
            selectedYear
          ) {
            won = session.diff.won ?? 0;
            lost = session.diff.lost ?? 0;
            sum = sum + won + lost;
          }
        });
        if (
          sum === 0 &&
          (item.lost > 0 || item.won > 0) &&
          selectedYear === currentDate
        ) {
          sum = item.lost + item.won;
        }
        BracketObjects.push({
          bracket_Name: item.bracket_type,
          games_count: sum,
        });
      }
    );
  });
  let currentName;
  let newObjectBracket = [];
  let sum = 0;
  Object.values(BracketObjects)
    .sort((a, b) => {
      return a.bracket_Name >= b.bracket_Name ? 1 : -1;
    })
    .forEach(
      (item: { games_count: number; bracket_Name: string }, index, array) => {
        if (currentName === item.bracket_Name && currentName !== undefined) {
          sum = sum + item.games_count;
        } else if (currentName !== item.bracket_Name) {
          newObjectBracket.push({
            name: currentName,
            count: sum,
          });
          sum = item.games_count;
        } else {
          sum = item.games_count;
        }
        currentName = item.bracket_Name;
        if (index === array.length - 1) {
          newObjectBracket.push({
            name: currentName,
            count: sum,
          });
        }
      }
    );
  return newObjectBracket;
}
function RadarChart({
  player,
  fullHistory,
  selectedYear,
  start,
  end,
  currentDate,
}) {
  const totalPlayers = useMemo(
    () => [player, ...(player?.alts || [])],
    [player]
  );
  // --- Specs aggregation ---
  const aggregatedSpecs = useMemo(
    () =>
      getSpecStatisticPlayer(
        fullHistory,
        selectedYear,
        start,
        end,
        currentDate
      ),
    [fullHistory, selectedYear, start, end, currentDate]
  );
  // Sort by games desc and keep top 10
  const topSpecs = useMemo(
    () =>
      [...aggregatedSpecs]
        .sort((a, b) => b.gamesAtSpec.sum - a.gamesAtSpec.sum)
        .slice(0, 10),
    [aggregatedSpecs]
  );
  // Ensure at least 3 specs of player's class are shown by padding with zero-count specs
  const {
    StatisticArrayNames,
    StaticArrayImages,
    StatisticArrayGames,
    ModifiedArraySpecsValues,
  } = useMemo(() => {
    const padded = [...topSpecs];
    if (padded.length < 3) {
      const classSpecs = CLASS_AND_SPECS[player.class] || [];
      classSpecs.forEach((spec: string) => {
        const full = `${spec} ${player.class}`;
        if (!padded.find((s) => s.name === full)) {
          padded.push({
            name: full,
            gamesAtSpec: { sum: 0 },
            spec: getSpecIcon(full),
          });
        }
      });
    }
    const names = padded.map((s) => s.name);
    const images = padded.map((s) => s.spec);
    const games = padded.map((s) => s.gamesAtSpec.sum);
    const values = games.map((g) => safeLog(g));
    return {
      StatisticArrayNames: names,
      StaticArrayImages: images,
      StatisticArrayGames: games,
      ModifiedArraySpecsValues: values,
    };
  }, [topSpecs, player.class]);
  const { FinalBracketArrayNames, FinalBracketArrayValues } = useMemo(() => {
    let bracketNamesArray: string[] = [];
    let bracketSumArray: number[] = [];
    let sumOfBracketShuffleArray = 0;
    let sumOfBracketBLITZArray = 0;
    Object.values(
      getBrackets(totalPlayers, selectedYear, start, end, currentDate)
    )
      .sort((a: { name: string }, b: { name: string }) => {
        return a > b ? 1 : -1;
      })
      .forEach((item: any) => {
        if (item.name !== undefined && item.name.split("-")[0] === "SHUFFLE") {
          sumOfBracketShuffleArray += item.count;
        }
        if (item.name !== undefined && item.name.split("-")[0] === "BLITZ") {
          sumOfBracketBLITZArray += item.count;
        }
        if (
          item.name !== undefined &&
          item.name.split("-")[0] !== "SHUFFLE" &&
          item.name.split("-")[0] !== "BLITZ"
        ) {
          bracketNamesArray.push(item.name.replace("-", " ").replace("_", " "));
          bracketSumArray.push(item.count);
        }
      });
    if (!bracketNamesArray.includes("ARENA 2v2")) {
      bracketNamesArray.push("ARENA 2v2");
      bracketSumArray.push(0);
    }
    if (!bracketNamesArray.includes("ARENA 3v3")) {
      bracketNamesArray.push("ARENA 3v3");
      bracketSumArray.push(0);
    }
    if (!bracketNamesArray.includes("BATTLEGROUNDS")) {
      bracketNamesArray.push("BATTLEGROUNDS");
      bracketSumArray.push(0);
    }
    bracketNamesArray.push("BLITZ");
    bracketSumArray.push(sumOfBracketBLITZArray);
    bracketNamesArray.push("SHUFFLE");
    bracketSumArray.push(sumOfBracketShuffleArray);
    const pairs = bracketNamesArray
      .map((item, index) => ({ name: item, value: bracketSumArray[index] }))
      .sort((a, b) => {
        if (a.name === "ARENA 2v2" && b.name === "ARENA 3v3") {
          return a.name < b.name ? 1 : -1;
        } else {
          return a.name > b.name ? 1 : -1;
        }
      });
    return {
      FinalBracketArrayNames: pairs.map((p) => p.name),
      FinalBracketArrayValues: pairs.map((p) => p.value),
    };
  }, [totalPlayers, selectedYear, start, end, currentDate]);

  const ModifiedArrayValuesBrackets = useMemo(
    () => FinalBracketArrayValues.map((v) => safeLog(v)),
    [FinalBracketArrayValues]
  );
  // Build icons for brackets using small SVG data URIs
  const svgDataUri = (text: string, bg: string, fg = "#ffffff") => {
    // Wider badge to fit words like "Shuffle"
    const w = 40;
    const h = 22;
    const fontSize = 8; // slightly smaller to avoid clipping
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><rect x='0' y='0' width='${w}' height='${h}' rx='5' ry='5' fill='${bg}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' font-size='${fontSize}' font-weight='700' fill='${fg}'>${text}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };
  const bracketIconImages = useMemo(
    () =>
      FinalBracketArrayNames.map((name) => {
        switch (name) {
          case "ARENA 2v2":
            return svgDataUri("2v2", "#1f6feb");
          case "ARENA 3v3":
            return svgDataUri("3v3", "#2ea043");
          case "BATTLEGROUNDS":
            return svgDataUri("BG", "#8957e5");
          case "SHUFFLE":
            return svgDataUri("Shuffle", "#f59e0b");
          case "BLITZ":
            return svgDataUri("Blitz", "#e11d48");
          default:
            return svgDataUri("?", "#6b7280");
        }
      }),
    [FinalBracketArrayNames]
  );
  // Plugin is registered globally above; we pass images via options to keep icons in sync.
  const dataBrackets = useMemo(
    () => ({
      labels: FinalBracketArrayNames,
      datasets: [
        {
          label: "Games",
          data: ModifiedArrayValuesBrackets,
          backgroundColor: DATA_BG,
          borderColor: DATA_BORDER,
          borderWidth: 2,
        },
      ],
    }),
    [FinalBracketArrayNames, ModifiedArrayValuesBrackets]
  );
  const dataSpecs = useMemo(
    () => ({
      labels: StatisticArrayNames,
      datasets: [
        {
          label: "Games",
          data: ModifiedArraySpecsValues,
          backgroundColor: DATA_BG,
          borderColor: DATA_BORDER,
          borderWidth: 2,
          fill: true,
        },
      ],
    }),
    [StatisticArrayNames, ModifiedArraySpecsValues]
  );
  // Shared builder for radar chart options
  const makeRadarOptions = ({
    iconPluginOptions,
    tooltipLabel,
    pointLabelCallback,
    layoutPadding,
  }: {
    iconPluginOptions?:
    | {
      images: string[];
      size?: number | { width: number; height: number };
      padding?: number;
      labelsUnderIcons?: string[];
      labelColor?: string;
      labelFont?: string;
      labelOffset?: number;
    }
    | false;
    tooltipLabel: (ctx: any) => string | string[];
    pointLabelCallback: (label: any, index: number) => string | string[];
    layoutPadding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  }) => ({
    type: "radar",
    maintainAspectRatio: false,
    animation: {
      duration: 0,
    },
    layout: {
      padding: {
        top: layoutPadding?.top ?? 28,
        right: layoutPadding?.right ?? 28,
        bottom: layoutPadding?.bottom ?? 28,
        left: layoutPadding?.left ?? 28,
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: { label: tooltipLabel },
      },
      iconPlugin: iconPluginOptions || false,
    },
    scales: {
      r: {
        min: 0,
        pointLabels: {
          display: false,
          color: "white",
          font: { size: 9 },
          padding: 12,
          callback: pointLabelCallback,
        },
        angleLines: { display: false },
        grid: {
          display: true,
          color: GRID_COLOR,
          lineWidth: 1,
          circular: true,
        },
        ticks: { display: false },
      },
    },
  });

  const percentLabelsSpecs = useMemo(() => {
    const sum = StatisticArrayGames.reduce((a, b) => a + b, 0) || 1;
    return StatisticArrayGames.map((g) => {
      const percent = (g / sum) * 100;
      if (!Number.isFinite(percent) || percent <= 0) return "0%";
      if (percent < 1) return `${percent.toFixed(1)}%`;
      return `${Math.round(percent)}%`;
    });
  }, [StatisticArrayGames]);

  const options = useMemo(
    () =>
      makeRadarOptions({
        iconPluginOptions: {
          images: StaticArrayImages,
          size: 18,
          padding: 25,
          labelsUnderIcons: percentLabelsSpecs,
          labelOffset: 10,
        },
        tooltipLabel: (ti) =>
          `🎯 Games: ${StatisticArrayGames[ti.dataIndex].toLocaleString()}`,
        pointLabelCallback: (_label, index) => {
          const sum = StatisticArrayGames.reduce((a, b) => a + b, 0) || 1;
          const percent = ((StatisticArrayGames[index] || 0) / sum) * 100;
          if (!Number.isFinite(percent) || percent <= 0) return ["0%"];
          if (percent < 1) return [`${percent.toFixed(1)}%`];
          return [`${Math.round(percent)}%`];
        },
        // Add extra padding so top/bottom icons are not clipped
        layoutPadding: { top: 50, bottom: 50, left: 30, right: 30 },
      }),
    [StaticArrayImages, StatisticArrayGames, percentLabelsSpecs]
  );

  const percentLabelsBrackets = useMemo(() => {
    const total = FinalBracketArrayValues.reduce((a, b) => a + b, 0) || 1;
    return FinalBracketArrayValues.map((v) => {
      const p = (v / total) * 100;
      if (!Number.isFinite(p) || p <= 0) return "0%";
      if (p < 1) return `${p.toFixed(1)}%`;
      return `${Math.round(p)}%`;
    });
  }, [FinalBracketArrayValues]);

  const optionsBrackets = useMemo(
    () =>
      makeRadarOptions({
        // Push icons further out and make them a bit larger to avoid percentage overlap
        iconPluginOptions: {
          images: bracketIconImages,
          size: { width: 32, height: 16 },
          padding: 20,
          labelsUnderIcons: percentLabelsBrackets,
          labelOffset: 16,
        },
        tooltipLabel: (tooltipItem) => {
          const label = tooltipItem.label;
          const value = FinalBracketArrayValues[tooltipItem.dataIndex];
          const formatTime = (minutes: number) => {
            if (minutes >= 60) {
              const hours = Math.round((minutes / 60) * 10) / 10;
              return `${hours} hours`;
            }
            return `${Math.round(minutes)} minutes`;
          };
          if (label === "BATTLEGROUNDS") {
            const games = Math.floor(value);
            const timeMin = games * 20;
            return [
              `🎯 Games: ${games}`,
              `⏳ Est. time: ${formatTime(timeMin)}`,
            ];
          } else if (label === "SHUFFLE") {
            const rounds = Math.floor(value);
            const lobbies = Math.floor(rounds / 6);
            const timeMin = rounds * 3;
            return [
              `🎯 Rounds: ${rounds}  Lobbies: ${lobbies}`,
              `⏳ Est. time: ${formatTime(timeMin)}`,
            ];
          } else if (label === "BLITZ") {
            const games = Math.floor(value);
            const timeMin = games * 10;
            return [
              `🎯 Games: ${games}`,
              `⏳ Est. time: ${formatTime(timeMin)}`,
            ];
          } else if (label === "ARENA 3v3" || label === "ARENA 2v2") {
            const games = Math.floor(value);
            const timeMin = games * 5;
            return [
              `🎯 Games: ${games}`,
              `⏳ Est. time: ${formatTime(timeMin)}`,
            ];
          }
          return `Games: ${Math.floor(value)}`;
        },
        pointLabelCallback: (_label, index) => {
          const total = FinalBracketArrayValues.reduce((a, b) => a + b, 0) || 1;
          const p = (FinalBracketArrayValues[index] / total) * 100;
          if (!Number.isFinite(p) || p <= 0) return ["0%"];
          if (p < 1) return [`${p.toFixed(1)}%`];
          return [`${Math.round(p)}%`];
        },
        // Extra padding for larger bracket icons (give more room on sides)
        layoutPadding: { top: 50, bottom: 50, left: 50, right: 50 },
      }),
    [bracketIconImages, FinalBracketArrayValues, percentLabelsBrackets]
  );
  const totalSpecGames = StatisticArrayGames.reduce((a, b) => a + b, 0);
  const totalBracketGames = FinalBracketArrayValues.reduce((a, b) => a + b, 0);
  return (
    <div className="flex flex-col lg:flex-row w-full mt-4 pt-4 border-t border-slate-600/40 justify-center items-stretch gap-6">
      {/* Specs Radar */}
      <div className="flex-1 min-w-0 max-w-[360px] mx-auto lg:mx-0">
        <div className="flex flex-col h-full rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-600/30 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600/30 bg-slate-800/40">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
              Specs Played
            </h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
              {totalSpecGames.toLocaleString()} games
            </span>
          </div>
          <div
            className="flex-1 flex items-center justify-center p-2"
            style={{ minHeight: "280px" }}
          >
            <div className="w-full aspect-square max-w-[360px] sm:max-w-[400px]">
              <Radar data={dataSpecs} options={options} />
            </div>
          </div>
        </div>
      </div>
      {/* Brackets Radar */}
      <div className="flex-1 min-w-0 max-w-[360px] mx-auto lg:mx-0">
        <div className="flex flex-col h-full rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/80 border border-slate-600/30 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-600/30 bg-slate-800/40">
            <h3 className="text-sm font-semibold text-slate-200 tracking-wide">
              Brackets
            </h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-full">
              {Math.floor(totalBracketGames).toLocaleString()} total
            </span>
          </div>
          <div
            className="flex-1 flex items-center justify-center p-2"
            style={{ minHeight: "280px" }}
          >
            <div className="w-full aspect-square max-w-[360px] sm:max-w-[400px]">
              <Radar data={dataBrackets} options={optionsBrackets} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadarChart;
