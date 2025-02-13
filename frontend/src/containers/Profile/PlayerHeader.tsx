import dayjs from "dayjs-ext";

import LoadingButton from "@mui/lab/LoadingButton";
import { Button } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import CopyButton from "@/components/CopyButton";
import type { Player } from "@/types";
import EmailIcon from "@mui/icons-material/Email";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

interface IProps {
  player: Player;
  loading: boolean;
  updatePlayer: () => void;
}

const TalentsButtons = ({ talents }: { talents: string }) => {
  const openTalentsTree = () => {
    window.open(
      `https://www.wowhead.com/talent-calc/blizzard/${talents}`,
      "_blank"
    );
  };
  return (
    <div className="flex gap-2 !text-xs">
      <Button
        className="!text-xs"
        style={{ color: "#60A5FACC" }}
        size="small"
        variant="text"
        onClick={openTalentsTree}
      >
        <OpenInNewIcon fontSize="small" className="!w-4 !h-4 mr-1" />
        Open talents tree
      </Button>
      <CopyButton content={talents}>Copy talents</CopyButton>
    </div>
  );
};

const InviteButtons = ({ player }: { player: Player }) => {
  const copyCommand = `/inv ${player.name}-${player.realm}`;
  return (
    <div className="flex gap-2 !text-xs">
      <CopyButton
        content={copyCommand}
        displayCopyIcon={false}
        copiedText="/INV Copied!"
      >
        <GroupAddIcon fontSize="small" className="!w-4 !h-4 mr-1" />
        Invite
      </CopyButton>
    </div>
  );
};

const WhisperButtons = ({ player }: { player: Player }) => {
  const copyCommand = `/w ${player.name}-${player.realm}`;
  return (
    <div className="flex gap-2 !text-xs">
      <CopyButton
        content={copyCommand}
        displayCopyIcon={false}
        copiedText="/W Copied!"
      >
        <EmailIcon fontSize="small" className="!w-4 !h-4 mr-1" />
        Whisper
      </CopyButton>
    </div>
  );
};

const LastUpdated = ({ player, loading, updatePlayer }: IProps) => {
  const relativeTime = (dayjs() as any).to(dayjs(player.lastUpdatedUTCms || 0));

  return (
    <div className="flex grow items-center md:justify-start">
      <span className="text-white leading-4 text-sm mr-2">
        Last updated {relativeTime}
      </span>

      <LoadingButton
        className="!text-xs"
        loadingPosition="start"
        startIcon={<RestoreIcon fontSize="small" />}
        onClick={updatePlayer}
        size="small"
        style={{ color: "#60A5FACC" }}
        loading={loading}
        variant="text"
      >
        Update now
      </LoadingButton>
    </div>
  );
};

export const PlayerHeader = ({ player, loading, updatePlayer }: IProps) => (
  <div className="flex gap-2 md:gap-0 mr-2 flex-col md:flex-row justify-between border border-solid rounded-lg border-[#37415180] px-3 py-1 bg-[#030303e6]">
    <LastUpdated
      player={player}
      loading={loading}
      updatePlayer={updatePlayer}
    />
    <InviteButtons player={player} />
    <WhisperButtons player={player} />
    <TalentsButtons talents={player.talents} />
  </div>
);

export default PlayerHeader;
