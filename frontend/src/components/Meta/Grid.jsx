import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, gridClasses} from '@mui/x-data-grid';
import {aroundColor, containerBg} from "../../theme";
import {Select, Typography} from "@mui/material";
import {getClassNameColor, specNameFromFullSpec} from "../DataTable/useColumns";
import {styled, alpha} from "@mui/material/styles";
import InputLabel from '@mui/material/InputLabel';
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";

const ODD_OPACITY = 0.2;

const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: '#0e1216'  ,
    '&:hover, &.Mui-hovered': {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&.Mui-selected': {
      backgroundColor: alpha(
        theme.palette.primary.main,
        ODD_OPACITY + theme.palette.action.selectedOpacity,
      ),
      '&:hover, &.Mui-hovered': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY +
          theme.palette.action.selectedOpacity +
          theme.palette.action.hoverOpacity,
        ),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY + theme.palette.action.selectedOpacity,
          ),
        },
      },
    },
  },
}));

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
  let filters = [
    {name: "Bracket", param_name:"bracket", default: "Shuffle", options: ['Shuffle',  '2v2', '3v3', 'Rbg']},
    { name: "Period", param_name: "period", default: "This season", options: ['Last month', 'Last week', 'Last day', 'This season'] },
    { name: "Role", param_name: "role", default: "All", options: ['All', 'Melee', 'Ranged', 'DPS', 'Healer', 'Tank'] }
  ]
  const RenderFilter = (filter) => {
    const [filterVal, setFilterVal] = React.useState(filter.default);
    return (<FormControl
      sx={{
        m: 1,
        minWidth: 110,
        backgroundColor: alpha(aroundColor, 0.3)
      }}
    >
      <InputLabel id="per-l">{filter.name}</InputLabel>
      <Select
        labelId="per-l"
        id="per"
        autoWidth
        value={filterVal}
        label={filter.param_name}>
        {filter.options.map((option) => {
          return (<MenuItem value={option}>{option}</MenuItem>)
        })}
      </Select>
    </FormControl>)
  }
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
      <Box
        marginX={1}
        marginY={1}
        padding={2}
        borderRadius={3}
        sx={{backgroundColor: alpha(aroundColor, 0.3)}}>
        <Typography variant={'h4'}>Meta</Typography>
        <Typography variant={'body1'}>Specs Popularity and Win rates, last month, last week and last day, any skill level, any ingame role</Typography>
      </Box>
      <Box
        marginX={1}
        marginY={1}
        padding={2}
        borderRadius={3}>
        {filters.map((filter) => {
          return RenderFilter(filter)
        })}
      </Box>
      <Box
        marginX={1}
        marginY={1}
        padding={2}
        borderRadius={3}
        sx={{backgroundColor: alpha(aroundColor, 0.3)}}>
        <StripedDataGrid
          experimentalFeatures={{columnGrouping: true}}
          columnGroupingModel={columnGroupingModel}
          getRowId={(row) => row.spec_name}
          rows={rows}
          loading={rows.length === 0}
          columns={columns}
          autoHeight={true}
          rowHeight={33.5}
          hideFooter={true}
          sx={{
            '&, [class^=MuiDataGrid]': {border: 'none'},
          }}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }
        />
      </Box>
    </Box>
  );
}

export default Grid;