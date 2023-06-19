import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid} from '@mui/x-data-grid';
import {containerBg} from "../../theme";
import {Typography} from "@mui/material";
import {getClassNameColor, specNameFromFullSpec} from "../DataTable/useColumns";

const percentageCellRender = (params) => {
  let trueVal = (params.value * 100).toFixed(2) + "%"
  return (<Typography>{trueVal}</Typography>)
}

const numericColumn = (fieldName, headerName) => {
  return {
    field: fieldName,
    headerName: headerName,
    minWidth: 50,
    editable: false,
    flex: 1,
    renderCell: percentageCellRender
  };
}

const specNameColumn = () => {
  return {
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
          <img src={specSrc} width={24} height={24}/>
          <Typography color={getClassNameColor(params.value)} sx={{paddingLeft: '10px'}}>{params.value}</Typography>
        </Box>
      )
    }
  }
}

const Grid = (data) => {
  let rows = data.data.specs
  if (rows === undefined) {
    rows = []
  }
  let columns = [specNameColumn(),]
  const columnGroupingModel = [];
  const addColumnGroup = (field, icon) => {
    let popularity = field + '_presence';
    let wr = field + '_win_rate';
    columns.push(numericColumn(popularity, 'Popularity %'))
    columns.push(numericColumn(wr, 'Win %'))
    columnGroupingModel.push({
      groupId: field,
      children: [{field: popularity}, {field: wr}]
    });
  }
  addColumnGroup('p100', '')
  addColumnGroup('p10', '')
  addColumnGroup('p01', '')
  addColumnGroup('p001', '')
  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: containerBg,
        paddingTop: '105px',
        paddingLeft: '10%',
        paddingRight: '10%',
        paddingBottom: '45px',
    }}>
      <DataGrid
        experimentalFeatures={{ columnGrouping: true }}
        columnGroupingModel={columnGroupingModel}
        getRowId={(row) => row.spec_name}
        rows={rows}
        loading={rows.length === 0}
        columns={columns}
        autoHeight={true}
        rowHeight={33.5}
        hideFooter={true}
      />
    </Box>
  );
}

export default Grid;