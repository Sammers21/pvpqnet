import { capitalizeFirstLetter } from "@/utils/common";
import { getSpecIcon, bracketToColor, ratingToColor } from "@/utils/table";
import { Avatar, Chip } from "@mui/material";

const CharacterChip = ({ char, show_nick = false }) => {
  var label;
  if (show_nick) {
    label = capitalizeFirstLetter(char.name);
  } else {
    label = char.rating;
  }
  if (char.pos === -1) {
    return <Chip label={label} />;
  }
  const specIcon = getSpecIcon(`${char.full_spec}` || "");
  const ratingColor = ratingToColor(char.rating);
  return (
    <div className="mx-1">
      <Chip
        avatar={<Avatar alt="class" src={specIcon} />}
        label={label}
        variant="outlined"
        style={{ color: ratingColor, borderColor: ratingColor }}
      />
    </div>
  );
};

export default CharacterChip;
