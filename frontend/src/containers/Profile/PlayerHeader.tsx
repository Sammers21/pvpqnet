import dayjs from "dayjs-ext";
import { Button, CircularProgress, Divider } from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShieldIcon from "@mui/icons-material/Shield";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import type { Player } from "@/types";

interface IProps {
  player: Player;
  loading: boolean;
  updatePlayer: () => void;
  onGearClick?: () => void;
  onTalentsClick?: () => void;
}

const ActionButton = ({
  onClick,
  icon,
  label,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
}) => (
  <Button
    className="!text-xs !normal-case !rounded-lg !px-3.5 !py-2 !min-w-0 !bg-slate-800/60 !border !border-slate-600/60 !text-sky-300 hover:!border-sky-400/60 hover:!bg-slate-800/90 !shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:!shadow-[0_12px_32px_rgba(96,165,250,0.22)] !backdrop-blur-sm !transition-all !duration-200"
    style={{ color: "#7cc4ff" }}
    size="small"
    variant="text"
    onClick={onClick}
  >
    {icon}
    <span className="ml-1.5">{label}</span>
  </Button>
);

const TalentsButtons = ({ onClick }: { onClick?: () => void }) => {
  return (
    <ActionButton
      onClick={onClick}
      icon={<AutoAwesomeMotionIcon fontSize="small" className="!w-4 !h-4" />}
      label="Talents"
    />
  );
};

const GearButton = ({ onClick }: { onClick?: () => void }) => (
  <ActionButton
    onClick={onClick}
    icon={<ShieldIcon fontSize="small" className="!w-4 !h-4" />}
    label="Gear"
  />
);

const LastUpdated = ({ player, loading, updatePlayer }: IProps) => {
  const relativeTime = (dayjs() as any).to(dayjs(player.lastUpdatedUTCms || 0));
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-[#9CA3AF]">
        <AccessTimeIcon className="!w-4 !h-4" />
        <span className="text-sm">Updated {relativeTime}</span>
      </div>
      <Button
        className="!text-xs !normal-case !rounded-lg !px-3 !py-1.5 hover:!bg-[#60A5FA15] !transition-all !duration-200"
        startIcon={
          loading ? (
            <CircularProgress size={16} thickness={5} sx={{ color: "#60A5FACC" }} />
          ) : (
            <RestoreIcon fontSize="small" className="!w-4 !h-4" />
          )
        }
        onClick={updatePlayer}
        size="small"
        sx={{ color: "#60A5FACC", "&.Mui-disabled": { color: "#60A5FACC" } }}
        disabled={loading}
        variant="text"
      >
        Update
      </Button>
    </div>
  );
};

const VerticalDivider = () => (
  <Divider
    orientation="vertical"
    flexItem
    className="!border-slate-600/40 !mx-1 hidden md:!block"
  />
);

export const PlayerHeader = ({
  player,
  loading,
  updatePlayer,
  onGearClick,
  onTalentsClick,
}: IProps) => (
  <div className="flex gap-2 md:gap-1 flex-col md:flex-row md:items-center justify-between border border-solid rounded-xl border-slate-600/40 px-4 py-2.5 bg-gradient-to-r from-slate-900/90 to-slate-800/70 backdrop-blur-sm shadow-lg">
    <div className="flex items-center gap-1 flex-wrap md:flex-nowrap">
      {onGearClick && (
        <>
          <GearButton onClick={onGearClick} />
          <VerticalDivider />
        </>
      )}
      <TalentsButtons onClick={onTalentsClick} />
    </div>
    <LastUpdated
      player={player}
      loading={loading}
      updatePlayer={updatePlayer}
    />
  </div>
);

export default PlayerHeader;
