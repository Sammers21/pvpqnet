import LoadingButton from '@mui/lab/LoadingButton';

import { IconButton, Tooltip } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import dayjs from 'dayjs-ext';

import type { IPlayer } from '../../types';

interface IProps {
  player: IPlayer;
  loading: boolean;
  updatePlayer: () => void;
}

const LastUpdated = ({ player, loading, updatePlayer }: IProps) => {
  const relativeTime = (dayjs() as any).to(dayjs(player.lastUpdatedUTCms || 0));

  return (
    <div className="flex items-center border border-solid rounded-lg border-[#37415180] justify-end px-3 py-1 bg-[#030303e6]">
      <span className="text-[#60A5FACC] text-sm mr-4">Last updated {relativeTime}</span>

      {loading ? (
        <LoadingButton
          style={{ color: '#60A5FACC', backgroundColor: '#60A5FA35', padding: 13, minWidth: 24 }}
          loading
          variant="outlined"
        />
      ) : (
        <Tooltip title="Update player" placement="top">
          <IconButton
            className="!rounded-md"
            onClick={updatePlayer}
            style={{ color: '#60A5FACC', backgroundColor: '#60A5FA35', padding: 2 }}
            edge="start"
            size="small"
          >
            <RestoreIcon />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
};

export default LastUpdated;
