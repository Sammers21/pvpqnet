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
      // color={"primary"}
      sx={{
        "& .MuiChip-label": {
          // color: "red"
          fontWeight: 'bold',
        }
       }}
      style={{
        border: "3px solid",
        
        color: ratingColor,
        borderColor: ratingColor,
      }}
    />
  );
};
