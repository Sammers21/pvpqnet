import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

import { DataGrid, gridClasses } from '@mui/x-data-grid';
import { styled, alpha } from '@mui/material/styles';

import Header from './Header';
import Filters, { IFilterValue } from './Filters';
import { getColumnGroup, specNameColumn } from './columnGroup';

import { baseUrl } from '../../../config';
import { REGIONS } from '../../../constants/region';
import type { IMeta } from '../../../types';
import type { GridColDef, GridColumnGroup, GridValidRowModel } from '@mui/x-data-grid';

const ODD_OPACITY = 0.2;

const columnGroups = [
  { field: '0.850', icons: ['rank_2.png', 'rank_4.png', 'rank_6.png'] },
  { field: '0.100', icons: ['rank_7.png', 'rank_8.png'] },
  { field: '0.050', icons: ['rank_9.png', 'rank_10.png'] },
];

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

  let [searchParams, setSearchParams] = useSearchParams();
  const [filterValues, setFilterValues] = useState<IFilterValue>(valuesFromSearch());

  const [columns, setColumns] = useState<GridColDef<GridValidRowModel>[]>(computeColumns().columns);
  const [columnGroupModel, setColorGroupModel] = useState<GridColumnGroup[]>(
    computeColumns().groups
  );

  function computeColumns(): {
    columns: GridColDef<GridValidRowModel>[];
    groups: GridColumnGroup[];
  } {
    const newColumns: GridColDef<GridValidRowModel>[] = [];
    const newGroups: GridColumnGroup[] = [];

    columnGroups.forEach((col) => {
      const { columns, columnGroup } = getColumnGroup(data, col.field, col.icons);
      newColumns.push(...columns);
      newGroups.push(columnGroup);
    });

    return { columns: [specNameColumn(isMobile), ...newColumns], groups: newGroups };
  }

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

  useEffect(() => {
    const newColumns: GridColDef<GridValidRowModel>[] = [];
    const newGroups: GridColumnGroup[] = [];

    columnGroups.forEach((col) => {
      const { columns, columnGroup } = getColumnGroup(data, col.field, col.icons);
      newColumns.push(...columns);
      newGroups.push(columnGroup);
    });

    setColumns([specNameColumn(isMobile), ...newColumns]);
    setColorGroupModel(newGroups);
  }, [data, isMobile]);

  return (
    <div className="flex w-full justify-center bg-[#030303e6] pt-24 pb-11">
      <div className="w-4/5">
        <Header />

        <Filters filters={metaFilter} onChange={handleFilterChange} values={filterValues} />

        <div className="mx-2 my-2 px-4 py-4 rounded-2xl bg-[#2f384d4d]">
          <StripedDataGrid
            experimentalFeatures={{ columnGrouping: true }}
            columnGroupingModel={columnGroupModel}
            getRowId={(row) => row.spec_name}
            rows={data?.specs || []}
            disableColumnMenu={true}
            loading={data?.specs?.length === 0}
            columns={columns}
            autoHeight={true}
            rowHeight={33.5}
            hideFooter={true}
            sx={{ '&, [class^=MuiDataGrid]': { border: 'none' } }}
            // sortModel={sortModel}
            // onSortModelChange={(newSortModel) => {
            //   console.log(newSortModel);
            //   if (!newSortModel.length) return;
            //   setSortModel(newSortModel);
            // }}
            initialState={{ sorting: { sortModel: [{ field: '0.050_presence', sort: 'desc' }] } }}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Grid;
