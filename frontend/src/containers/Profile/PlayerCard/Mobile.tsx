import { useState } from "react";
import { openWowArmory } from "@/utils/urlparts";
import { PlayerItemLvl, PlayerImages, PlayerName } from "./common";
import type { Player } from "@/types";
import { IconButton, Tooltip } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import GearModal from "../GearModal";

interface IProps {
  player: Player;
  openArmory?: () => void;
}

const PlayerCard = ({ player }: IProps) => {
  const [gearModalOpen, setGearModalOpen] = useState(false);
  const openArmory = () => {
    openWowArmory(player);
  };
  return (
    <>
      <div className="flex rounded-xl gap-3 border border-solid border-slate-600/40 px-3 py-3 bg-gradient-to-r from-slate-900/90 to-slate-800/70 shadow-lg hover:border-sky-500/30 transition-all duration-300">
        {player.media?.avatar && (
          <div className="relative">
            <img
              className="object-cover select-none h-[90px] w-[90px] rounded-xl border-2 border-solid border-sky-500/25 shadow-lg"
              alt="Player"
              src={player.media.avatar}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />

            {/* Gear button overlay */}
            <Tooltip title="View Gear" placement="top">
              <IconButton
                onClick={() => setGearModalOpen(true)}
                sx={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  backgroundColor: "#60A5FAcc",
                  padding: "4px",
                  "&:hover": {
                    backgroundColor: "#60A5FA",
                  },
                }}
              >
                <ShieldIcon sx={{ fontSize: 16, color: "#fff" }} />
              </IconButton>
            </Tooltip>
          </div>
        )}
        <div className="flex grow justify-between">
          <div className="flex flex-col justify-between py-0.5">
            <PlayerName player={player} openArmory={openArmory} />
            <PlayerItemLvl player={player} />
          </div>

          <div className="flex items-end">
            <PlayerImages player={player} />
          </div>
        </div>
      </div>

      {/* Gear Modal */}
      <GearModal
        player={player}
        open={gearModalOpen}
        onClose={() => setGearModalOpen(false)}
      />
    </>
  );
};

export default PlayerCard;
