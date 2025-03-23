import {
  Chart as ChartJS,
  RadialLinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  plugins,
} from "chart.js";
import { Radar } from "react-chartjs-2";
import { getDetaisImages, getSpecIcon } from "@/utils/table";
import { CLASS_AND_SPECS } from "@/constants/filterSchema";
import { useEffect } from "react";
ChartJS.register(
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

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
  let currentSpec;
  let SpecsObjects = [];
  let sum = 0;
  Object.values(fullHistory)
    .sort((a, b) => {
      if (a.character !== undefined && b.character !== undefined) {
        return a.character.full_spec >= b.character.full_spec ? 1 : -1;
      } else {
        return a < b ? 1 : -1;
      }
    })
    .forEach((item) => {
      if (
        item.character !== undefined &&
        item.character.full_spec !== "{spec} {class}" &&
        new Date(item.diff.timestamp).getFullYear().toString() === selectedYear
      ) {
        if (
          currentSpec !== item.character.full_spec &&
          currentSpec !== undefined
        ) {
          const character_Class = item.character.class;
          const character_Race = item.character.race;
          const character_Gender = item.character.gender;
          SpecsObjects.push({
            spec: getDetaisImages({
              wowClass: character_Class,
              wowGender: character_Gender,
              wowRace: character_Race,
              wowSpec: currentSpec,
            }).specIcon,
            gamesAtSpec: { sum },
            name: currentSpec,
          });
          sum = 0;
        }
        const won = item.diff.won ?? 0;
        const lost = item.diff.lost ?? 0;
        sum = sum + won + lost;
        currentSpec = item.character.full_spec;
      } else if (selectedYear === currentDate && item.character !== undefined) {
        if (start <= new Date(item.diff.timestamp) <= end) {
          if (
            currentSpec !== item.character.full_spec &&
            currentSpec !== undefined &&
            item.character.full_spec !== "{spec} {class}"
          ) {
            const character_Class = item.character.class;
            const character_Race = item.character.race;
            const character_Gender = item.character.gender;
            SpecsObjects.push({
              spec: getDetaisImages({
                wowClass: character_Class,
                wowGender: character_Gender,
                wowRace: character_Race,
                wowSpec: currentSpec,
              }).specIcon,
              gamesAtSpec: { sum },
              name: currentSpec,
            });
            sum = 0;
          }
          const won = item.diff.won ?? 0;
          const lost = item.diff.lost ?? 0;
          sum = sum + won + lost;
          currentSpec = item.character.full_spec;
        }
      }
    });
  return SpecsObjects;
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
          if (
            end < new Date(session.diff.timestamp).toString < start &&
            selectedYear === currentDate
          ) {
            won = session.diff.won ?? 0;
            lost = session.diff.won ?? 0;
            sum = sum + won + lost;
          } else if (
            selectedYear !== currentDate &&
            new Date(session.diff.timestamp).getFullYear().toString() ===
              selectedYear
          ) {
            won = session.diff.won ?? 0;
            lost = session.diff.won ?? 0;
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
  let StatisticArrayNames = [];
  let StaticArrayImages = [];
  let StatisticArrayGames = [];
  const totalPlayers = [player, ...player.alts];
  Object.values(
    getSpecStatisticPlayer(fullHistory, selectedYear, start, end, currentDate)
  )
    .sort((a, b) => {
      return a.gamesAtSpec.sum < b.gamesAtSpec.sum ? 1 : -1;
    })
    .forEach((item, index) => {
      if (index < 5 || index === item.length) {
        StaticArrayImages.push(item.spec);
        StatisticArrayGames.push(item.gamesAtSpec.sum);
        StatisticArrayNames.push(item.name);
      }
    });
  let ModifiedArraySpecsValues = [];
  if (StatisticArrayNames.length < 3) {
    const SpecsOfPlayerClass = CLASS_AND_SPECS[player.class];
    SpecsOfPlayerClass.forEach((element) => {
      if (!StatisticArrayNames.includes(element + " " + player.class)) {
        StatisticArrayNames.push(element + " " + player.class);
        StaticArrayImages.push(getSpecIcon(element + ' ' +player.class))
        StatisticArrayGames.push(0);
      }
    });
  }
  StatisticArrayGames.forEach((item) => {
    ModifiedArraySpecsValues.push(
      Math.log(item) / Math.log(Math.E / 2) !== (-Infinity || Infinity)
        ? Math.log(item) / Math.log(Math.E / 2)
        : 0
    );
  });
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
  
  let ModifiedArrayValuesBrackets = [];
  FinalBracketArrayValues.forEach((item) => {
    ModifiedArrayValuesBrackets.push(
      Math.log(item) !== (-Infinity || Infinity)
        ? Math.log(item) / Math.log(Math.E / 2)
        : 0
    );
  });
  const iconPlugin = {
    id: "iconPlugin",
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      const xCenter = chart.scales.r.xCenter;
      const yCenter = chart.scales.r.yCenter;
      const labelCount = chart.data.labels.length;

      chart.data.labels.forEach((label, index) => {
        const angle = Math.PI / 2 - (2 * Math.PI * index) / labelCount;
        const xLabel =
          xCenter + Math.cos(angle) * (chart.scales.r.drawingArea + 5);
        const yLabel =
          yCenter - Math.sin(angle) * (chart.scales.r.drawingArea + 10);
        const img = new Image();
        img.src = StaticArrayImages[index];
        ctx.drawImage(
          img,
          index === 0? xLabel - 35 : (index < 5 && index >=2 ? xLabel-10: xLabel),
          index >= 2 && index < 4 ? yLabel - 30 : (index == 0 ? yLabel - 10 : yLabel+5),
          20,
          20
        );
      });
    },
  };
  useEffect(() => {
    ChartJS.unregister(iconPlugin);
    ChartJS.register(iconPlugin);
  }, [StaticArrayImages]);
  const dataBrackets = {
    labels: FinalBracketArrayNames,
    datasets: [
      {
        label: "Games",
        data: ModifiedArrayValuesBrackets,
        backgroundColor: "rgba(63, 106, 163, 0.73)",
        borderColor: "rgba(5, 113, 255, 0.73)",
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
        backgroundColor: "rgba(63, 106, 163, 0.73)",
        borderColor: "rgba(5, 113, 255, 0.73)",
        borderWidth: 2,
        fill: true,
      },
    ],
  };
  const options = {
    type: "radar",
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            
            return `Games: ${StatisticArrayGames[tooltipItem.dataIndex]}`;
          },
        },
      },
      iconPlugin: true,
    },
    scales: {
      r: {
        min: 0,
        pointLabels: {
          display: true,
          color: "white",
          font: {
            size: 8,
          },
          callback: function (label, index) {
            let sum = 0;
            const img = new Image();
            img.src = StaticArrayImages[index];
            StatisticArrayGames.forEach((item) => {
              sum = sum + item;
            });
            let percentValue = Math.round((StatisticArrayGames[index] / sum) * 100) ?? 0
            return [`${percentValue !== 0 && !Number.isNaN(percentValue) ? percentValue+'%' : '0%'}`];
          },
        },
        angleLines: {
          display: true,
          color: "rgb(47, 70, 100)",
          lineWidth: 2,
        },
        grid: {
          display: true,
          color: "rgba(58, 58, 58, 0.98)",
          lineWidth: 1,
        },
        ticks: {
          display: false,
        },
      },
    },
  };
  const optionsBrackets = {
    type: "radar",
    plugins: {
      iconPlugin: false,
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        callbacks: {
          label: (tooltipItem) => {
            const label = tooltipItem.label;
            let value = FinalBracketArrayValues[tooltipItem.dataIndex];
            if (label === "BATTLEGROUNDS") {
              return [
                `🎯Games: ${Math.floor(value / 4)}`,
                `⏳Estimated time: ${
                  (value / 4) * 20 > 100
                    ? Math.round((((value / 4) * 20) / 60) * 100) / 100 +
                      " hours"
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
                    ? Math.round((((value / 1.7) * 3) / 60) * 100) / 100 +
                      " hours"
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
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        pointLabels: {
          color: "white",
          font: {
            size: 10,
          },
          callback: function (label, index) {
            let sum = 0;
            let percent = 0;
            FinalBracketArrayValues.forEach((item) => {
              sum = sum + item;
            });
            percent = (FinalBracketArrayValues[index] / sum) * 100;
            return [
              `${
                percent < 6 ? String(percent).slice(0, 4) : Math.floor(percent)
              }%`,
              `${label}`,
            ];
          },
        },
        angleLines: {
          display: true,
          color: "rgb(47, 70, 100)",
          lineWidth: 2,
        },
        grid: {
          display: true,
          color: "rgba(58, 58, 58, 0.98)",
          lineWidth: 1,
        },
        ticks: {
          display: false,
        },
      },
    },
  };
  return (
    <>
      <div className="flex flex-col sm:flex-row w-[102.8%] -ml-[10px] border-t-[2px] mt-[20px] border-solid border-[#37415180] p-[10px] justify-around">
        <div className="flex-none w-[300px] h-[300px] border border-solid border-[#37415180] p-[5px] rounded ">
          <Radar data={dataSpecs} options={options}></Radar>
        </div>
        <div className="border-r-[2px] border-solid border-[#37415180]"></div>
        <div className="flex-none w-[300px] h-[300px] border border-solid border-[#37415180] p-[5px] rounded">
          <Radar data={dataBrackets} options={optionsBrackets}></Radar>
        </div>
      </div>
    </>
  );
}

export default RadarChart;
