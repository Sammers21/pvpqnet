import { Divider } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import { tableColumns } from './columns';
import type { IPlayer } from '../../../types';

const Alts = ({ alts }: { alts?: IPlayer[] }) => {
  if (!alts || !alts.length) return null;

  return (
    <div className="flex flex-col border border-solid rounded-lg border-[#37415180] px-3 py-4 bg-[#030303e6]">
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
        onSortModelChange={(value) => console.log(value)}
        disableRowSelectionOnClick
      />
    </div>
  );
};

export default Alts;
