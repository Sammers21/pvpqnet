import { IPlayerBracket } from "@/types";
import { bracketToColor, getSpecIcon } from "@/utils/table";
import { Avatar, Chip } from "@mui/material";

export const SpecChip = ({
  fullSpec,
  bracket,
  label,
}: {
  fullSpec: string;
  bracket: Partial<IPlayerBracket>;
  label: string;
}) => {
  const specIcon = getSpecIcon(`${fullSpec}` || "");
  const ratingColor = bracketToColor(bracket);
  return (
    <Chip
      avatar={<Avatar alt="class" src={specIcon} />}
      label={label}
      variant="outlined"
      style={{ color: ratingColor, borderColor: ratingColor }}
    />
  );
};
