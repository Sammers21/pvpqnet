import React, { useEffect, useMemo, useRef } from 'react';
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
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { size } from 'lodash';
import { getDetaisImages } from '@/utils/table';
import { callback } from 'node_modules/chart.js/dist/helpers/helpers.core';
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
        return a.character.full_spec > b.character.full_spec ? 1 : -1;
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
              wowSpec: currentSpec
            }).specIcon,
            gamesAtSpec: { sum },
            name: currentSpec
          });
          sum = 0;
        }
        const won = item.diff.won ?? 0;
        const lost = item.diff.lost ?? 0;
        sum = sum + won + lost;
        currentSpec = item.character.full_spec;
      } else if (selectedYear === currentDate && item.character !== undefined) {
        if (start < new Date(item.diff.timestamp) < end) {
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
              wowSpec: currentSpec
            }).specIcon,
            gamesAtSpec: { sum },
            name: item.character.full_spec
          })
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
function getBrackets(totalPlayers){
  let BracketObjects = [];
  totalPlayers.forEach((element) => {
    element.brackets.forEach((item:{bracket_type:string;won:number;lost:number}) => {
      let sum = 0;
      let won = item.won ?? 0;
      let lost = item.lost ?? 0;
      sum = won+lost;
      BracketObjects.push({
        bracket_Name: item.bracket_type,
        games_count: sum
      })
    })
  });
  let currentName;
  let newObjectBracket = []
  let sum = 0;
  Object.values(BracketObjects).sort((a,b) => {
    return a.bracket_Name > b.bracket_Name ? 1 : -1;
  }).forEach((item: {games_count:number;bracket_Name:string}) => {
    if (currentName === item.bracket_Name && currentName !== undefined){
      sum = sum + item.games_count;
    }
    else if(currentName !== item.bracket_Name && sum !== 0){
      newObjectBracket.push({
        name: item.bracket_Name,
        count: sum
      })
      sum = 0;
    }
    currentName = item.bracket_Name;
  })
  return newObjectBracket;
}
function RadarChart({player,fullHistory,selectedYear,start,end,currentDate}){
    let StatisticArrayNames = []
    let StaticArrayImages = []
    let StatisticArrayGames = [];
    const totalPlayers = [player,...player.alts];
    const chartRef = useRef(null);
      Object.values(getSpecStatisticPlayer(fullHistory,selectedYear,start,end,currentDate)).forEach((item) => {
        StaticArrayImages.push(item.spec)
        StatisticArrayGames.push(item.gamesAtSpec.sum)
        StatisticArrayNames.push(item.name);
      })
    let bracketNamesArray = [];
    let bracketSumArray = [];
    Object.values(getBrackets(totalPlayers)).sort((a,b) => {
      return a.count > b.count ? 1 : -1;
    }).forEach((item) => {
      bracketNamesArray.push(item.name);
      bracketSumArray.push(item.count)
    })
    const dataBrackets = {
      labels: bracketNamesArray,
      datasets:[
        {
          label: 'Games',
          data: bracketSumArray,
          backgroundColor: 'rgba(63, 106, 163, 0.73)',
          borderColor: '',
          borderWidth: 0,
        },
      ]
    }
    const dataSpecs = {
        labels: StatisticArrayNames,
        datasets: [
          {
            label: 'Games',
            data: StatisticArrayGames,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            pointBackgroundColor: 'rgb(83, 83, 83)',
            fill: true,
          },
        ]
      };
    
    const options = {
      responsive: true,
      type: 'radar',
        scales: {
            r: {
              min: 0,
                pointLabels: {
                  display:false,
                    font: {
                      size: 8, 
                    },
                  },
              angleLines: {
                display: true,
                color: 'rgb(47, 70, 100)',
                lineWidth: 2,
              },
              grid: {
                circular: true,
                color: 'rgba(28, 31, 123, 0)',
                lineWidth: 1, 
              },
              ticks:{
                display: false
              }
            }
        },
        plugins: {
          tooltip: {
            enabled: true
          }
        }
    }
    const optionsBrackets = {
      type: 'radar',
        scales: {
            r: { 
              min: 0,
                pointLabels: {
                    color: "white",
                    font: {
                      size: 8, 
                    },
                  },
              angleLines: {
                display: true,
                color: 'rgb(47, 70, 100)',
                lineWidth: 1,
              },
              grid: {
                circular: true,
                color: 'rgba(28, 31, 123, 0)',
                lineWidth: 1, 
              },
              ticks:{
                display: false
              }
            }
        },
    }
    useEffect(() => {
      const chart = chartRef.current;
    if (!chart) return;

    chart.options.plugins.tooltip = {
      afterDraw: (chart) => {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        if (!chartArea) return;
    
        chart.scales.r.getLabels().forEach((point, index) => {
          const label = chart.scales.r.getPointPosition(index, chart.scales.r.min);
          const img = new Image();
          img.src = StaticArrayImages[index];
          img.onload = () => {
            ctx.drawImage(img, label.x - 15, label.y - 15, 30, 30);
          };
        });
      },
    };

    chart.update();
    }, []);
    return (
        <>
        <div className='flex w-[100%]'>
          <div className='w-[550px]'>
            <Radar ref={chartRef} data={dataSpecs} options={options}></Radar>
          </div>
          <div className='w-[550px]'>
            <Radar data={dataBrackets} options={optionsBrackets}></Radar>
          </div>
        </div>
        </>
    )
}

export default RadarChart;
