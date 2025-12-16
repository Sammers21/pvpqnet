import {useState} from "react";
import {IconButton, Tooltip} from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import GearModal from "@/containers/Profile/GearModal";
import type {CharacterAndDiff, Player} from "@/types";

interface GearIconCellProps {
  record: CharacterAndDiff;
  region: string;
  inline?: boolean; // When true, renders inline for name column
}

/**
 * Creates a minimal Player object from CharacterAndDiff for the GearModal.
 * GearModal will fetch equipment data on-demand using the player's region/realm/name.
 */
const createPlayerFromRecord = (
  record: CharacterAndDiff,
  region: string
): Player => {
  const char = record.character || record;
  return {
    id: 0,
    name: char.name || record.name,
    class: char.class || record.class,
    fraction: char.fraction || record.fraction,
    realm: char.realm || record.realm,
    gender: char.gender || record.gender,
    itemLevel: 0,
    lastUpdatedUTCms: 0,
    activeSpec: char.full_spec || record.full_spec || "",
    race: char.race || record.race,
    region: region,
    talents: "",
    achievements: { achievements: [], titles_history: { expansions: [] } },
    pvpTalents: [],
  };
};

const GearIconCell = ({
  record,
  region,
  inline = false,
}: GearIconCellProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  const player = createPlayerFromRecord(record, region);

  return (
    <>
      <Tooltip title="View Gear & PvP Talents" placement="top">
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModalOpen(true);
          }}
          className={inline ? "gear-icon-inline" : ""}
          sx={{
            opacity: 0,
            transition: "opacity 0.15s ease, transform 0.15s ease",
            color: "#60A5FA",
            padding: "2px",
            marginRight: "12px",
            ".table-row-hover:hover &, tr:hover &": {
              opacity: 1,
            },
            "&:hover": {
              backgroundColor: "rgba(96, 165, 250, 0.15)",
              transform: "scale(1.1)",
            },
          }}
        >
          <ShieldIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>

      <GearModal
        player={player}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default GearIconCell;
