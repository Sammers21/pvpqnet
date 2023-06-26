import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, gridClasses} from '@mui/x-data-grid';
import {aroundColor, containerBg} from "../../theme";
import {LinearProgress, Select, Tooltip, Typography} from "@mui/material";
import {getClassNameColor, specNameFromFullSpec} from "../DataTable/useColumns";
import {styled, alpha} from "@mui/material/styles";
import InputLabel from '@mui/material/InputLabel';
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import {useEffect, useState} from "react";
import {useParams, useSearchParams} from "react-router-dom";
import axios, {options} from "axios";
import {baseUrl} from "../../config";

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
  let color = 'green';
  if (params.field.includes('presence')) {
    color = 'red';
  }
  let progress = params.value / params.colDef.maxVal * 100;
  let trueVal = (params.value * 100).toFixed(2) + "%"
  if(params.value === 0) {
    return (
      <Box width={'100%'}>
        <Typography>-</Typography>
        <LinearProgress
          sx={{
            backgroundColor: 'white',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'gray'
            }
          }}
          variant="determinate" value={progress}/>
      </Box>
    )
  } else {
    return (
      <Box width={'100%'}>
        <Typography>{trueVal}</Typography>
        <LinearProgress
          sx={{
            backgroundColor: 'white',
            '& .MuiLinearProgress-bar': {
              backgroundColor: color
            }
          }}
          variant="determinate" value={progress}/>
      </Box>
    )
  }
}

const numericColumn = (fieldName, headerName, maxVal) => {
  return {
    field: fieldName,
    maxVal: maxVal,
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

const toLowerAndReplace = (str) => {
  return str.toLowerCase().replace(" ", "_")
}

const Grid = () => {
  const { region = 'eu' } = useParams();
  let [data, setData] = useState({});
  let [filters, setFilters] = useState([{ name: "Bracket", param_name:"bracket", current: "Shuffle", options: ['Shuffle', '2v2', '3v3', 'Battlegrounds']},
    { name: "Period", param_name: "period", current: "This season", options: ['Last month', 'Last week', 'Last day', 'This season'] },
    { name: "Role", param_name: "role", current: "All", options: ['All', 'Melee', 'Ranged', 'Dps', 'Healer', 'Tank'] }
  ]);
  const loadMeta = async () => {
    let rParam = { region: region }
    filters.forEach((filter) => {
      rParam[filter.param_name] = toLowerAndReplace(filter.current)
    })
    const data = (await axios.get(baseUrl + `/api/meta`, {params: rParam})).data
    console.log("params and data", rParam, data)
    setData(data);
  };
  let rows = data.specs
  if (rows === undefined) {
    rows = []
  }
  let [searchParams, setSearchParams] = useSearchParams();
  let columns = [specNameColumn(),]
  useEffect(() => {
    loadMeta();
  }, [filters, region]);
  const RenderFilter = (filter) => {
    const searchParamName = searchParams.get(filter.param_name)
    if (searchParamName !== null) {
      filter.options.filter((option) => {
        if (toLowerAndReplace(option) === toLowerAndReplace(searchParamName)) {
          filter.current = option
        }
      })
    }
    const [filterVal, setFilterVal] = useState(filter.current);
    const handleChange = (event) => {
      let newFilters = filters.map((f) => {
        if (f.name === filter.name) {
          f.current = event.target.value
          searchParams.set(f.param_name, toLowerAndReplace(event.target.value))
        }
        return f
      })
      setSearchParams(searchParams)
      setFilters(newFilters);
      setFilterVal(event.target.value);
    };
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
        label={filter.param_name}
        onChange={handleChange}>
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
    let maxPopularity = 0;
    let maxWr = 0;
    if (data.specs !== undefined) {
      data.specs.forEach((spec) => {
        maxPopularity = Math.max(maxPopularity, spec[popularity])
        maxWr = Math.max(maxWr, spec[wr])
      })
    }
    const charCount = data.specs_sizing[field+'_total']
    const from = data.specs_sizing[field+'_min']
    const to = data.specs_sizing[field+'_max']
    const colTitle = `Based on ${charCount} characters between ${from} and ${to} rating`
    columns.push(numericColumn(popularity, 'Popularity %', maxPopularity ))
    columns.push(numericColumn(wr, 'Win %', maxWr))
    columnGroupingModel.push({
      groupId: field,
      children: [{field: popularity}, {field: wr}],
      headerAlign: 'center',
      renderHeaderGroup: (params) => {
        return (
          <Tooltip title={colTitle} placement="top-end">
            <Box
              display={'flex'} flexDirection={'row'} justifyContent={'center'}>
              {rankIcons.map((icon) => {
                return (
                  <img src={require('../../assets/ranks/' + icon)} width={24} height={24}/>
                )
              })}
            </Box>
          </Tooltip>
        )
      }
    });
  }
  addColumnGroup('0.502', ['rank_2.png', 'rank_4.png', 'rank_6.png'])
  addColumnGroup('0.332', ['rank_7.png', 'rank_8.png'])
  addColumnGroup('0.166', ['rank_9.png','rank_10.png'])
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
        <Typography variant={'body1'}>Specs Popularity and Win rates, last month, last week, last day, any skill level, any role and any bracket</Typography>
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
          initialState={{
            sorting: {
              sortModel: [{ field: '0.166_presence', sort: 'desc' }],
            },
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