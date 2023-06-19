import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid} from '@mui/x-data-grid';
import {containerBg} from "../../theme";
import {Typography} from "@mui/material";
import {specNameFromFullSpec} from "../DataTable/useColumns";

const percentageCellRender = (params) => {
  let trueVal = (params.value * 100).toFixed(2) + "%"
  return (<Typography>{trueVal}</Typography>)
}

const columns = [
  {
    field: 'spec_name', headerName: 'Spec', width: 250, editable: false, renderCell: (params) => {
      let specSrc;
      let specIcon = specNameFromFullSpec(params.value) + '.png';
      try {
        specSrc = require('../../assets/specicons/' + specIcon);
      } catch (e) {
        console.log(`SpecIcon: ${specIcon} was not found`)
        specSrc = require('../../assets/unknown.png');
      }
      return (
        <Box display={'flex'} flexDirection={'row'}>
          <img src={specSrc} width={30} height={30}/>
          <Typography sx={{paddingLeft: '10px'}}>{params.value}</Typography>
        </Box>
      )
    }
  },
  {field: 'p100_presence', headerName: '100% Presence', width: 100, editable: false, renderCell: percentageCellRender},
  {field: 'p100_win_rate', headerName: '100% Win Rate', width: 100, editable: false, renderCell: percentageCellRender},
  {field: 'p10_presence', headerName: '10% Presence', width: 100, editable: false, renderCell: percentageCellRender},
  {field: 'p10_win_rate', headerName: '10% Win Rate', width: 100, editable: false, renderCell: percentageCellRender},
  {field: 'p01_presence', headerName: '1% Presence', width: 100, editable: false, renderCell: percentageCellRender},
  {field: 'p01_win_rate', headerName: '1% Win Rate', width: 100, editable: false, renderCell: percentageCellRender},
  {field: 'p001_presence', headerName: '0.1% Presence', width: 100, editable: false, renderCell: percentageCellRender},
  {field: 'p001_win_rate', headerName: '0.1% Win Rate', width: 100, editable: false, renderCell: percentageCellRender},

];

const rowsExample = [
  {
    "spec_name": " Mistweaver Monk",
    "p001_win_rate": 0.6683606294155426,
    "p001_presence": 0.07142857142857142,
    "p01_win_rate": 0.6198453583982446,
    "p01_presence": 0.06428571428571428,
    "p10_win_rate": 0.6198453583982446,
    "p10_presence": 0.06428571428571428,
    "p35_win_rate": 0.6198453583982446,
    "p35_presence": 0.06428571428571428,
    "p50_win_rate": 0.6198453583982446,
    "p50_presence": 0.06428571428571428,
    "p100_win_rate": 0.6000248800044744,
    "p100_presence": 0.14761904761904762
  }
];


const Grid = (data) => {
  let rows = data.data.specs
  console.log("row for grid",data, rows)
  if (rows === undefined) {
    rows = rowsExample
  }
  return (
    <Box
      sx={{
        backgroundColor: containerBg,
        minHeight: '100vh',
        paddingTop: '105px',
        paddingLeft: '3%',
        paddingRight: '3%',
        paddingBottom: '45px',
    }}>
      <DataGrid
        getRowId={(row) => row.spec_name}
        rows={rows}
        columns={columns}
        autoHeight={true}
        hideFooter={true}
      />
    </Box>
  );
}

export default Grid;