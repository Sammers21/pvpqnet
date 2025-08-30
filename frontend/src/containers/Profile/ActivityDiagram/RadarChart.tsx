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
const ICON_SIZE = 18; // px
const ICON_PADDING = 36; // distance from outer radius
const GRID_COLOR = "rgba(55, 65, 81, 0.5)"; // tailwind gray-700 ~50%
const DATA_BG = "rgba(63, 106, 163, 0.73)"; // fill
const DATA_BORDER = "rgba(5, 113, 255, 0.73)"; // line

// --- Generic helpers ---
const isWithinRange = (ts: Date, start: Date, end: Date) =>
  ts >= start && ts <= end;
const safeLog = (value: number, base = Math.E / 2) => {
  if (!value || value <= 0) return 0;
  const v = Math.log(value) / Math.log(base);
  return Number.isFinite(v) ? v : 0;
};
const sumGames = (won?: number, lost?: number) => (won ?? 0) + (lost ?? 0);

// Custom plugin to draw spec icons at the ends of the radar axes.
// Expects `options.plugins.iconPlugin.images` to be an array of image URLs aligned with labels.
const iconPlugin = {
  id: "iconPlugin",
  afterDraw: (chart) => {
    const images = chart?.options?.plugins?.iconPlugin?.images || [];
    if (!images.length) return;
    const ctx = chart.ctx;
    const xCenter = chart.scales.r.xCenter;
    const yCenter = chart.scales.r.yCenter;
    const labelCount = chart.data.labels.length;

    chart.data.labels.forEach((_, index) => {
      const angle = Math.PI / 2 - (2 * Math.PI * index) / labelCount;
      const radius = chart.scales.r.drawingArea + ICON_PADDING;
      const x = xCenter + Math.cos(angle) * radius - ICON_SIZE / 2;
      const y = yCenter - Math.sin(angle) * radius - ICON_SIZE / 2;
      const img = new Image();
      img.onload = () => chart.draw();
      img.src = images[index];
      if (img.complete) {
        ctx.drawImage(img, x, y, ICON_SIZE, ICON_SIZE);
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
  const totalPlayers = [player, ...(player?.alts || [])];
  // --- Specs aggregation ---
  const aggregatedSpecs = getSpecStatisticPlayer(
    fullHistory,
    selectedYear,
    start,
    end,
    currentDate
  );
  // Sort by games desc and keep top 5
  const topSpecs = aggregatedSpecs
    .sort((a, b) => b.gamesAtSpec.sum - a.gamesAtSpec.sum)
    .slice(0, 5);
  // Ensure at least 3 specs of player's class are shown by padding with zero-count specs
  if (topSpecs.length < 3) {
    const classSpecs = CLASS_AND_SPECS[player.class] || [];
    classSpecs.forEach((spec: string) => {
      const full = `${spec} ${player.class}`;
      if (!topSpecs.find((s) => s.name === full)) {
        topSpecs.push({
          name: full,
          gamesAtSpec: { sum: 0 },
          spec: getSpecIcon(full),
        });
      }
    });
  }
  const StatisticArrayNames = topSpecs.map((s) => s.name);
  const StaticArrayImages = topSpecs.map((s) => s.spec);
  const StatisticArrayGames = topSpecs.map((s) => s.gamesAtSpec.sum);
  const ModifiedArraySpecsValues = StatisticArrayGames.map((g) => safeLog(g));
  let bracketNamesArray = [];
  let bracketSumArray = [];
  let sumOfBracketShuffleArray = 0;
  let sumOfBracketBLITZArray = 0;
  Object.values(
    getBrackets(totalPlayers, selectedYear, start, end, currentDate)
  )
    .sort((a: { name: string }, b: { name: string }) => {
      return a > b ? 1 : -1;
    })
    .forEach((item) => {
      if (item.name !== undefined && item.name.split("-")[0] === "SHUFFLE") {
        sumOfBracketShuffleArray = sumOfBracketShuffleArray + item.count;
      }
      if (item.name !== undefined && item.name.split("-")[0] === "BLITZ") {
        sumOfBracketBLITZArray = sumOfBracketBLITZArray + item.count;
      }
      if (
        item.name !== undefined &&
        item.name.split("-")[0] !== "SHUFFLE" &&
        item.name.split("-")[0] !== "BLITZ"
      ) {
        bracketNamesArray.push(item.name.replace("-", " ").replace("_", " "));
        bracketSumArray.push(
          item.name === "BATTLEGROUNDS" ? item.count * 4 : item.count
        );
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
  bracketSumArray.push(sumOfBracketBLITZArray * 2);
  bracketNamesArray.push("SHUFFLE");
  bracketSumArray.push(sumOfBracketShuffleArray / 1.7);
  let FinalBracketArrayNames = [];
  let FinalBracketArrayValues = [];
  bracketNamesArray
    .map((item, index) => {
      return {
        name: item,
        value: bracketSumArray[index],
      };
    })
    .sort((a, b) => {
      if (a.name === "ARENA 2v2" && b.name === "ARENA 3v3") {
        return a.name < b.name ? 1 : -1;
      } else {
        return a.name > b.name ? 1 : -1;
      }
    })
    .forEach((item) => {
      FinalBracketArrayNames.push(item.name);
      FinalBracketArrayValues.push(item.value);
    });

  const ModifiedArrayValuesBrackets = FinalBracketArrayValues.map((v) =>
    safeLog(v)
  );
  // Build icons for brackets using small SVG data URIs
  const svgDataUri = (text: string, bg: string, fg = "#ffffff") => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'><rect x='0' y='0' width='20' height='20' rx='4' ry='4' fill='${bg}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif' font-size='9' font-weight='700' fill='${fg}'>${text}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };
  const bracketIconImages = FinalBracketArrayNames.map((name) => {
    switch (name) {
      case "ARENA 2v2":
        return svgDataUri("2v2", "#1f6feb");
      case "ARENA 3v3":
        return svgDataUri("3v3", "#2ea043");
      case "BATTLEGROUNDS":
        return svgDataUri("BG", "#8957e5");
      case "SHUFFLE":
        return svgDataUri("SH", "#f59e0b");
      case "BLITZ":
        return svgDataUri("BZ", "#e11d48");
      default:
        return svgDataUri("?", "#6b7280");
    }
  });
  // Plugin is registered globally above; we pass images via options to keep icons in sync.
  const dataBrackets = {
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
  };
  const dataSpecs = {
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
  };
  // Shared builder for radar chart options
  const makeRadarOptions = ({
    iconImages,
    tooltipLabel,
    pointLabelCallback,
  }: {
    iconImages?: string[] | false;
    tooltipLabel: (ctx: any) => string | string[];
    pointLabelCallback: (label: any, index: number) => string | string[];
  }) => ({
    type: "radar",
    maintainAspectRatio: false,
    layout: {
      padding: { top: 28, right: 28, bottom: 28, left: 28 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: { label: tooltipLabel },
      },
      iconPlugin: iconImages ? { images: iconImages } : false,
    },
    scales: {
      r: {
        min: 0,
        pointLabels: {
          display: true,
          color: "white",
          font: { size: 8 },
          padding: 4,
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

  const options = makeRadarOptions({
    iconImages: StaticArrayImages,
    tooltipLabel: (ti) => `Games: ${StatisticArrayGames[ti.dataIndex]}`,
    pointLabelCallback: (_label, index) => {
      const sum = StatisticArrayGames.reduce((a, b) => a + b, 0);
      const pv = Math.round(
        ((StatisticArrayGames[index] || 0) / (sum || 1)) * 100
      );
      return [`${!Number.isNaN(pv) ? pv : 0}%`];
    },
  });

  const optionsBrackets = makeRadarOptions({
    iconImages: bracketIconImages,
    tooltipLabel: (tooltipItem) => {
      const label = tooltipItem.label;
      let value = FinalBracketArrayValues[tooltipItem.dataIndex];
      if (label === "BATTLEGROUNDS") {
        return [
          `🎯Games: ${Math.floor(value / 4)}`,
          `⏳Estimated time: ${
            (value / 4) * 20 > 100
              ? Math.round((((value / 4) * 20) / 60) * 100) / 100 + " hours"
              : Math.round((value / 4) * 20) + " minutes"
          }`,
        ];
      } else if (label === "SHUFFLE") {
        return [
          `🎯Rounds: ${Math.floor(value / 1.7)} Lobbies: ${Math.floor(
            value / 1.7 / 6
          )}`,
          `⏳Estimated time: ${
            (value / 1.7) * 3 > 100
              ? Math.round((((value / 1.7) * 3) / 60) * 100) / 100 + " hours"
              : Math.round((value / 1.7) * 3) + " minutes"
          }`,
        ];
      } else if (label === "BLITZ") {
        return [
          `🎯Games: ${Math.floor(value / 2)}`,
          `⏳Estimated time: ${
            (value / 2) * 10 > 100
              ? Math.round((value / 2 / 60) * 100) / 10 + " hours"
              : Math.round((value / 2) * 10) + " minutes"
          }`,
        ];
      } else if (label === "ARENA 3v3") {
        return [
          `🎯Games: ${Math.floor(value)}`,
          `⏳Estimated time: ${
            value * 5 > 100
              ? Math.round(((value * 5) / 60) * 100) / 100 + " hours"
              : Math.round(value * 5) + " minutes"
          }`,
        ];
      } else if (label === "ARENA 2v2") {
        return [
          `🎯Games: ${Math.floor(value)}`,
          `⏳Estimated time: ${
            value * 5 > 100
              ? Math.round(((value * 5) / 60) * 100) / 100 + " hours"
              : Math.round(value * 5) + " minutes"
          }`,
        ];
      }
      return `Games: ${Math.floor(value)}`;
    },
    pointLabelCallback: (_label, index) => {
      const total = FinalBracketArrayValues.reduce((a, b) => a + b, 0) || 1;
      const p = (FinalBracketArrayValues[index] / total) * 100;
      return [`${p < 6 ? String(p).slice(0, 4) : Math.floor(p)}%`];
    },
  });
  return (
    <>
      <div className="flex flex-col sm:flex-row w-full mt-[20px] border-t border-[#37415180] p-2 sm:p-3 justify-center gap-4">
        <div className="flex-none w-[300px] h-[300px] rounded-lg bg-[#0b1326]/30 p-1 shadow-sm ">
          <Radar data={dataSpecs} options={options}></Radar>
        </div>
        <div
          className="shrink-0 bg-[#37415180]/60 w-full h-px sm:w-px sm:h-[300px]"
          aria-hidden="true"
        />
        <div className="flex-none w-[300px] h-[300px] rounded-lg bg-[#0b1326]/30 p-1 shadow-sm">
          <Radar data={dataBrackets} options={optionsBrackets}></Radar>
        </div>
      </div>
    </>
  );
}

export default RadarChart;
