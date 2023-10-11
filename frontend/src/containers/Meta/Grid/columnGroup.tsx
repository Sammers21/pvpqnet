import { LinearProgress, Tooltip } from '@mui/material';
import { getClassNameColor, getSpecIcon } from '@/utils/table';

import type { IMetaSpec, IMetaSpecSizing, IMeta } from '@/types';
import type {
  GridAlignment,
  GridColDef,
  GridColumnGroup,
  GridRenderCellParams,
  GridValidRowModel,
} from '@mui/x-data-grid';

const PercentageCell = (params: GridRenderCellParams & { colDef: { maxVal: number } }) => {
  const progressColor = params.field.includes('presence') ? 'red' : 'green';

  const progress = (params.value / params.colDef.maxVal) * 100;
  const trueVal = (params.value * 100).toFixed(2) + '%';

  if (params.value === 0) {
    return (
      <div className="w-full">
        <span className="text-base">-</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <span className="text-base">{trueVal}</span>
      <LinearProgress
        sx={{
          backgroundColor: 'transparent',
          '& .MuiLinearProgress-bar': { backgroundColor: progressColor },
        }}
        variant="determinate"
        value={progress}
      />
    </div>
  );
};

function numericColumn(
  fieldName: string,
  headerName: string,
  maxVal: number
): GridColDef & { maxVal: number } {
  return {
    field: fieldName,
    maxVal: maxVal,
    headerName: headerName,
    minWidth: 50,
    editable: false,
    flex: 1,
    renderCell: PercentageCell as any,
  };
}

export function specNameColumn(isMobile: boolean): GridColDef {
  return {
    field: 'spec_name',
    headerName: 'Spec',
    width: isMobile ? 10 : 250,
    editable: false,
    renderCell: (params) => {
      const specIcon = getSpecIcon(params.value);

      return (
        <div className="flex justify-start items-center">
          <img src={specIcon} className="w-6 h-6" alt="spec-icon" />
          {!isMobile && (
            <span className="pl-2 text-base" style={{ color: getClassNameColor(params.value) }}>
              {params.value}
            </span>
          )}
        </div>
      );
    },
  };
}

export function getColumnGroup(
  data: null | IMeta,
  field: string,
  rankIcons: string[]
): { columns: GridColDef<GridValidRowModel>[]; columnGroup: GridColumnGroup } {
  const popularity = `${field}_presence` as keyof IMetaSpec;
  const winrate = `${field}_win_rate` as keyof IMetaSpec;

  let maxPopularity = 0;
  let maxWr = 0;
  if (data?.specs) {
    data?.specs.forEach((spec) => {
      maxPopularity = Math.max(maxPopularity, spec[popularity] as number);
      maxWr = Math.max(maxWr, spec[winrate] as number);
    });
  }

  let columnTitle = `No data for ${field}`;
  if (data?.specs_sizing) {
    const charCount = data.specs_sizing[`${field}_total` as keyof IMetaSpecSizing] || 0;
    const from = data.specs_sizing[`${field}_min` as keyof IMetaSpecSizing] || 0;
    const to = data.specs_sizing[`${field}_max` as keyof IMetaSpecSizing] || 0;

    columnTitle = `Based on ${charCount} characters between ${from} and ${to} rating`;
  }

  const columns = [
    numericColumn(popularity, 'Popularity %', maxPopularity),
    numericColumn(winrate, 'Win %', maxWr),
  ];

  const columnGroup = {
    groupId: field,
    children: [{ field: popularity }, { field: winrate }],
    headerAlign: 'center' as GridAlignment,
    renderHeaderGroup: () => (
      <Tooltip title={columnTitle} placement="top-end">
        <div className="flex justify-center">
          {rankIcons.map((icon) => (
            <img
              className="h-9 w-9 mr-2"
              src={require('../../../assets/ranks/' + icon)}
              alt="Rank icon"
            />
          ))}
        </div>
      </Tooltip>
    ),
  };

  return { columns, columnGroup };
}
