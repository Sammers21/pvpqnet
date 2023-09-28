import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { aroundColor, borderRadius, containerBg } from '../../../theme';
import { LinearProgress, Tooltip, Typography } from '@mui/material';
import { getClassNameColor, specNameFromFullSpec } from '../../../utils/table';
import { styled, alpha } from '@mui/material/styles';

import Header from './Header';
import Filters, { IFilterValue } from './Filters';

import axios from 'axios';
import { baseUrl } from '../../../config';
import { REGIONS } from '../../../constants/region';
import { IMeta } from '../../../types';

const ODD_OPACITY = 0.2;

const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: '#0e1216',
    '&:hover, &.Mui-hovered': {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&.Mui-selected': {
      backgroundColor: alpha(
        theme.palette.primary.main,
        ODD_OPACITY + theme.palette.action.selectedOpacity
      ),
      '&:hover, &.Mui-hovered': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY + theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity
        ),
        // Reset on touch devices, it doesn't add specificity
        '@media (hover: none)': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY + theme.palette.action.selectedOpacity
          ),
        },
      },
    },
  },
}));

type TFilterName = 'bracket' | 'period' | 'role';

interface IMetaFilter {
  title: string;
  name: TFilterName;
  options: string[];
}

const metaFilter: IMetaFilter[] = [
  {
    title: 'Bracket',
    name: 'bracket',
    options: ['Shuffle', '2v2', '3v3', 'Battlegrounds'],
  },
  {
    title: 'Period',
    name: 'period',
    options: ['Last month', 'Last week', 'Last day', 'This season'],
  },
  {
    title: 'Role',
    name: 'role',
    options: ['All', 'Melee', 'Ranged', 'Dps', 'Healer', 'Tank'],
  },
];

const defaultFilters: Record<TFilterName, string> = {
  bracket: 'Shuffle',
  period: 'This season',
  role: 'All',
};

const percentageCellRender = (params) => {
  let color = 'green';
  if (params.field.includes('presence')) {
    color = 'red';
  }
  let progress = (params.value / params.colDef.maxVal) * 100;
  let trueVal = (params.value * 100).toFixed(2) + '%';
  if (params.value === 0) {
    return (
      <Box width={'100%'}>
        <Typography>-</Typography>
        <LinearProgress
          colo
          sx={{
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': {
              backgroundColor: 'gray',
            },
          }}
          variant="determinate"
          value={progress}
        />
      </Box>
    );
  } else {
    return (
      <Box width={'100%'}>
        <Typography>{trueVal}</Typography>
        <LinearProgress
          sx={{
            backgroundColor: 'transparent',
            '& .MuiLinearProgress-bar': {
              backgroundColor: color,
            },
          }}
          variant="determinate"
          value={progress}
        />
      </Box>
    );
  }
};

const numericColumn = (fieldName, headerName, maxVal) => {
  return {
    field: fieldName,
    maxVal: maxVal,
    headerName: headerName,
    minWidth: 50,
    editable: false,
    flex: 1,
    renderCell: percentageCellRender,
  };
};

const specNameColumn = (isMobile) => {
  let width = 250;
  if (isMobile) {
    width = 10;
  }
  return {
    field: 'spec_name',
    headerName: 'Spec',
    width: width,
    editable: false,
    renderCell: (params) => {
      let specSrc;
      let specIcon = specNameFromFullSpec(params.value) + '.png';
      try {
        specSrc = require('../../../assets/specicons/' + specIcon);
      } catch (e) {
        specSrc = require('../../../assets/unknown.png');
      }
      return (
        <Box
          display={'flex'}
          flexDirection={'row'}
          justifyContent={'flex-start'}
          alignItems={'center'}
        >
          <img src={specSrc} width={24} height={24} />
          {!isMobile && (
            <Typography color={getClassNameColor(params.value)} sx={{ paddingLeft: '10px' }}>
              {params.value}
            </Typography>
          )}
        </Box>
      );
    },
  };
};

const paramFromString = (str: string) => {
  return str.toLowerCase().replace(' ', '_');
};

const Grid = () => {
  const { region = REGIONS.eu } = useParams();
  let [data, setData] = useState<IMeta | null>(null);

  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    window.addEventListener('resize', function () {
      setWidth(window.innerWidth);
    });
    return () => {
      window.removeEventListener('resize', function () {
        setWidth(window.innerWidth);
      });
    };
  }, []);
  const isMobile = width <= 900;

  let rows = data?.specs || [];
  if (rows === undefined) {
    rows = [];
  }
  let columns = [specNameColumn(isMobile)];

  const columnGroupingModel = [];
  const addColumnGroup = (field, rankIcons) => {
    let popularity = field + '_presence';
    let wr = field + '_win_rate';
    let maxPopularity = 0;
    let maxWr = 0;
    if (data?.specs !== undefined) {
      data?.specs.forEach((spec) => {
        maxPopularity = Math.max(maxPopularity, spec[popularity]);
        maxWr = Math.max(maxWr, spec[wr]);
      });
    }
    let colTitle;
    if (data?.specs_sizing === undefined) {
      colTitle = `No data for ${field}`;
    } else {
      let charCount = data.specs_sizing[field + '_total'];
      if (charCount === undefined) {
        charCount = 0;
      }
      let from = data.specs_sizing[field + '_min'];
      if (from === undefined) {
        from = 0;
      }
      let to = data.specs_sizing[field + '_max'];
      if (to === undefined) {
        to = 0;
      }
      colTitle = `Based on ${charCount} characters between ${from} and ${to} rating`;
    }
    columns.push(numericColumn(popularity, 'Popularity %', maxPopularity));
    columns.push(numericColumn(wr, 'Win %', maxWr));
    columnGroupingModel.push({
      groupId: field,
      children: [{ field: popularity }, { field: wr }],
      headerAlign: 'center',
      renderHeaderGroup: (params) => {
        return (
          <Tooltip title={colTitle} placement="top-end">
            <Box display={'flex'} flexDirection={'row'} justifyContent={'center'}>
              {rankIcons.map((icon) => {
                return (
                  <img src={require('../../../assets/ranks/' + icon)} width={36} height={36} />
                );
              })}
            </Box>
          </Tooltip>
        );
      },
    });
  };
  addColumnGroup('0.850', ['rank_2.png', 'rank_4.png', 'rank_6.png']);
  addColumnGroup('0.100', ['rank_7.png', 'rank_8.png']);
  addColumnGroup('0.050', ['rank_9.png', 'rank_10.png']);
  let paddingLeft = '10%';
  let paddingRight = '10%';
  if (isMobile) {
    paddingLeft = '0%';
    paddingRight = '0%';
  }

  let [searchParams, setSearchParams] = useSearchParams();
  const [filterValues, setFilterValues] = useState<IFilterValue>(valuesFromSearch());

  const handleFilterChange = (value: string, filterName: string) => {
    searchParams.set(filterName, paramFromString(value));

    setFilterValues({ ...filterValues, [filterName]: value });
    setSearchParams(searchParams);
  };

  function valuesFromSearch() {
    const values = defaultFilters;

    metaFilter.forEach(({ name, options }) => {
      const param = searchParams.get(name);
      if (!param) return;

      const value = options.find((option) => paramFromString(option) === paramFromString(param));
      if (!value) return;

      values[name] = value;
    });

    return values;
  }

  useEffect(() => {
    async function loadMeta() {
      const params: Record<string, string> = { region: region };

      metaFilter.forEach((filter) => {
        params[filter.name] = paramFromString(filterValues[filter.name]);
      });

      const data = (await axios.get(baseUrl + `/api/meta`, { params })).data;
      setData(data);
    }

    loadMeta();
  }, [filterValues, region]);

  return (
    <Box
      sx={{
        width: '100%',
        backgroundColor: containerBg,
        paddingTop: '105px',
        paddingLeft: paddingLeft,
        paddingRight: paddingRight,
        paddingBottom: '45px',
      }}
    >
      <Header />

      <Filters filters={metaFilter} onChange={handleFilterChange} values={filterValues} />

      <Box
        marginX={1}
        marginY={1}
        padding={2}
        borderRadius={borderRadius}
        sx={{ backgroundColor: alpha(aroundColor, 0.3) }}
      >
        <StripedDataGrid
          experimentalFeatures={{ columnGrouping: true }}
          columnGroupingModel={columnGroupingModel}
          getRowId={(row) => row.spec_name}
          rows={rows}
          disableColumnMenu={true}
          loading={rows.length === 0}
          columns={columns}
          autoHeight={true}
          rowHeight={33.5}
          hideFooter={true}
          sx={{
            '&, [class^=MuiDataGrid]': { border: 'none' },
          }}
          initialState={{
            sorting: {
              sortModel: [{ field: '0.050_presence', sort: 'desc' }],
            },
          }}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }
        />
      </Box>
    </Box>
  );
};

export default Grid;
