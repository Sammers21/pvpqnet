// import { useMemo } from 'react';
import { Divider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import { tableColumns } from './columnGroup';

import type { IPlayer } from '../../types';

const Alts = ({ alts }: { alts?: IPlayer[] }) => {
  // const altRows = useMemo(
  //   () =>
  //     alts.map((alt) => {
  //       alt.brackets?.forEach((bracket) => {
  //         if (bracket.bracket_type.startsWith('SHUFFLE')) {
  //           let cur = alt['SHUFFLE'];
  //           if (cur === undefined) {
  //             cur = 0;
  //           }
  //           alt['SHUFFLE'] = Math.max(cur, bracket.rating);
  //         } else {
  //           alt[bracket.bracket_type] = bracket.rating;
  //         }
  //       });

  //       ['SHUFFLE', 'ARENA_2v2', 'ARENA_3v3', 'BATTLEGROUNDS'].forEach((bracket) => {
  //         if (!alt[bracket]) alt[bracket] = 0;
  //       });
  //       return alt;
  //     }),
  //   [alts]
  // );

  if (!alts || !alts.length) return null;

  return (
    <div className="flex grow flex-col border border-solid rounded-lg border-[#37415180] px-3 py-4 bg-[#030303e6]">
      <span className="text-2xl">Alts</span>

      <Divider className="!my-2" />
      <DataGrid
        rows={alts}
        columns={tableColumns}
        getRowId={(row) => {
          return row.id;
        }}
        sx={{ '&, [class^=MuiDataGrid]': { border: 'none' } }}
        hideFooter
        disableColumnMenu
        disableRowSelectionOnClick
      />
    </div>
  );
};

export default Alts;
