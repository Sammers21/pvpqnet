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
  const addColumnGroup = (field, rankIcons) => {
    let popularity = field + '_presence';
    let wr = field + '_win_rate';
    columns.push(numericColumn(popularity, 'Popularity %'))
    columns.push(numericColumn(wr, 'Win %'))
    columnGroupingModel.push({
      groupId: field,
      children: [{field: popularity}, {field: wr}],
      headerAlign: 'center',
      renderHeaderGroup: (params) => {
        return (
          <Box
            display={'flex'} flexDirection={'row'} justifyContent={'center'}>
            {rankIcons.map((icon) => {
              return (
                <img src={require('../../assets/ranks/' + icon)} width={24} height={24}/>
              )
            })}
          </Box>
        )
      }
    });
  }
  addColumnGroup('p100', ['rank_2.png', 'rank_4.png', 'rank_6.png'])
  addColumnGroup('p10', ['rank_7.png', 'rank_8.png'])
  addColumnGroup('p01', ['rank_9.png','rank_10.png'])
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