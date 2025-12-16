import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { createBreakpoint, useWindowSize } from "react-use";

import { DataGrid, gridClasses } from "@mui/x-data-grid";
import { styled, alpha } from "@mui/material/styles";

import Header from "./Header";
import Filters from "./Filters";
import { getColumnGroup, specNameColumn } from "./columnGroup";

import { REGION } from "@/constants/region";
import { columnGroups, defaultFilters, metaFilter } from "@/constants/meta";
import { getMeta } from "@/services/stats.service";
import { getRegion } from "@/utils/urlparts";

import type { Meta } from "@/types";
import type {
  GridColDef,
  GridColumnGroup,
  GridValidRowModel,
} from "@mui/x-data-grid";
import type { IFilterValue } from "../types";

const ODD_OPACITY = 0.2;

export const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: "#0e1216",
    minHeight: "200px",
    "&:hover, &.Mui-hovered": {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
      "@media (hover: none)": {
        backgroundColor: "transparent",
      },
    },
    "&.Mui-selected": {
      backgroundColor: alpha(
        theme.palette.primary.main,
        ODD_OPACITY + theme.palette.action.selectedOpacity
      ),
      "&:hover, &.Mui-hovered": {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY +
            theme.palette.action.selectedOpacity +
            theme.palette.action.hoverOpacity
        ),
        // Reset on touch devices, it doesn't add specificity
        "@media (hover: none)": {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY + theme.palette.action.selectedOpacity
          ),
        },
      },
    },
  },
}));

function paramFromString(str: string) {
  return str.toLowerCase().replace(" ", "_");
}

const useBreakpoint = createBreakpoint({ S: 758, L: 900, XL: 1280, XXL: 1600 });

const Grid = () => {
  const { region: regionFromUrl } = useParams();
  const region = getRegion(regionFromUrl);
  const [data, setData] = useState<Meta | null>(null);
  const breakpoint = useBreakpoint();
  const { width } = useWindowSize();

  let [searchParams, setSearchParams] = useSearchParams();
  const [filterValues, setFilterValues] = useState<IFilterValue>(
    valuesFromSearch()
  );

  const [columns, setColumns] = useState<GridColDef<GridValidRowModel>[]>(
    computeColumns().columns
  );
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
      const { columns, columnGroup } = getColumnGroup(
        data,
        col.field,
        col.icons,
        width
      );
      newColumns.push(...columns);
      newGroups.push(columnGroup);
    });

    return {
      columns: [specNameColumn(breakpoint === "S"), ...newColumns],
      groups: newGroups,
    };
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

      const value = options.find(
        (option) => paramFromString(option) === paramFromString(param)
      );
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

      const data = await getMeta(params);
      setData(data);
    }

    loadMeta();
  }, [filterValues, region]);

  useEffect(() => {
    const newColumns: GridColDef<GridValidRowModel>[] = [];
    const newGroups: GridColumnGroup[] = [];

    columnGroups.forEach((col) => {
      const { columns, columnGroup } = getColumnGroup(
        data,
        col.field,
        col.icons,
        width
      );
      newColumns.push(...columns);
      newGroups.push(columnGroup);
    });

    setColumns([specNameColumn(breakpoint === "S"), ...newColumns]);
    setColorGroupModel(newGroups);
  }, [data, breakpoint]);

  return (
    <div className="relative flex w-full justify-center pt-24 pb-11 min-h-screen">
      {/* Ambient background effects */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-sky-500/8 blur-[150px]"></div>
        <div className="absolute bottom-0 left-0 h-[450px] w-[550px] -translate-x-1/4 translate-y-1/4 rounded-full bg-blue-600/6 blur-[130px]"></div>
        <div className="absolute bottom-1/3 right-0 h-[400px] w-[450px] translate-x-1/4 rounded-full bg-indigo-500/5 blur-[120px]"></div>
      </div>
      <div className="w-full md:w-4/5">
        <Header />
        <Filters
          filters={metaFilter}
          onChange={handleFilterChange}
          values={filterValues}
        />
        <div className="mx-2 my-2 px-4 py-4 rounded-2xl bg-slate-900/60 border border-slate-700/30 backdrop-blur-sm">
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
            sx={{ "&, [class^=MuiDataGrid]": { border: "none" } }}
            initialState={{
              sorting: {
                sortModel: [{ field: "0.050_presence", sort: "desc" }],
              },
            }}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? "even" : "odd"
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Grid;
