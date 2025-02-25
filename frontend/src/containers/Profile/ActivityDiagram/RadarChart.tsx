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
            currentSpec !== undefined && item.character.full_spec !== '{spec} {class}'
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
function getBrackets(totalPlayers,selectedYear,start,end,currentDate){
  let BracketObjects = [];
  totalPlayers.forEach((element) => {
    element.brackets.forEach((item:{bracket_type:string;won:number;lost:number; gaming_history: {history : {session: {diff: {won:number;lost:number;timestamp:number}}}}}) => {
      let sum = 0;
      let won = 0;
      let lost = 0;
      Object.values(item.gaming_history.history).forEach((session) => {
        if (end < new Date(session.diff.timestamp).toString < start && selectedYear === currentDate){
          won = session.diff.won ?? 0;
          lost = session.diff.won ?? 0;
          sum = sum + won + lost
        }
        else if (selectedYear !== currentDate && new Date(session.diff.timestamp).getFullYear().toString() === selectedYear){
          won = session.diff.won ?? 0;
          lost = session.diff.won ?? 0;
          sum = sum + won + lost
        }
      })
      BracketObjects.push({
        bracket_Name: item.bracket_type,
        games_count: sum,
      });
    })
  });
  let currentName;
  let newObjectBracket = []
  let sum = 0;
  Object.values(BracketObjects).sort((a,b) => {
    return a.bracket_Name > b.bracket_Name ? 1 : -1;
  }).forEach((item: {games_count:number;bracket_Name:string},index, array) => {
    if (currentName === item.bracket_Name && currentName !== undefined){
      sum = sum + item.games_count;
    }
    else if((currentName !== item.bracket_Name) && sum > 0 ){
      newObjectBracket.push({
        name: currentName,
        count: sum
      })
      sum = item.games_count;
    }
    else{
      sum = item.games_count
    }
    currentName = item.bracket_Name;
    if (index === array.length -1){
      newObjectBracket.push({
        name: currentName,
        count: sum
      })
    }
  })
  return newObjectBracket;
}
function RadarChart({player,fullHistory,selectedYear,start,end,currentDate}){
    let StatisticArrayNames = []
    let StaticArrayImages = []
    let StatisticArrayGames = [];
    const totalPlayers = [player,...player.alts];
      Object.values(getSpecStatisticPlayer(fullHistory,selectedYear,start,end,currentDate)).forEach((item) => {
        StaticArrayImages.push(item.spec)
        StatisticArrayGames.push(item.gamesAtSpec.sum)
        StatisticArrayNames.push(item.name);
      })
    
    let bracketNamesArray = [];
    let bracketSumArray = [];
    let sumOfBracketShuffleArray = 0;
    let sumOfBracketBLITZArray = 0;
      Object.values(getBrackets(totalPlayers,selectedYear,start,end,currentDate)).sort((a: {name:string},b: {name:string}) => {
        return a > b ? 1 : -1;
      }).forEach((item) => {
        if ((item.name).split('-')[0] === 'SHUFFLE'){
          sumOfBracketShuffleArray = sumOfBracketShuffleArray + item.count
        }
        if ((item.name).split('-')[0] === 'BLITZ'){
          sumOfBracketBLITZArray = sumOfBracketBLITZArray + item.count
        }
        if (item.name.split('-')[0] !== 'SHUFFLE' && item.name.split('-')[0] !== 'BLITZ'){
          bracketNamesArray.push(item.name.replace('-',' ').replace('_',' '));
          bracketSumArray.push(item.count)
        }
      })
    if (sumOfBracketBLITZArray){
      bracketNamesArray.push('BLITZ');
      bracketSumArray.push(sumOfBracketBLITZArray*2)
    }
    if (sumOfBracketShuffleArray > 0){
      bracketNamesArray.push('SHUFFLE');
      bracketSumArray.push(sumOfBracketShuffleArray)
    }
    const dataBrackets = {
      labels: bracketNamesArray,
      datasets:[
        {
          label: 'Games',
          data: bracketSumArray,
          backgroundColor: 'rgba(63, 106, 163, 0.73)',
          borderColor: 'rgba(5, 113, 255, 0.73)',
          borderWidth: 1,
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
                  display:true,
                    font: {
                      color: 'white',
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
    return (
        <>
        <div className='flex w-[100%]'>
          <div className='w-[550px]'>
            <Radar data={dataSpecs} options={options}></Radar>
          </div>
          <div className='w-[550px]'>
            <Radar data={dataBrackets} options={optionsBrackets}></Radar>
          </div>
        </div>
        </>
    )
}

export default RadarChart;
