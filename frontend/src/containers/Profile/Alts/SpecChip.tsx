import { IPlayerBracket } from "@/types";
import { bracketToColor, getSpecIcon } from "@/utils/table";
import { Avatar, Chip } from "@mui/material";



export const SpecChip = (alt, spec, bracket: Partial<IPlayerBracket>) => {
    const specIcon = getSpecIcon(`${spec} ${alt.class}` || '');
    const ratingColor = bracketToColor(bracket);
    return (
        <Chip
            avatar={<Avatar alt="class" src={specIcon} />}
            label={bracket?.rating}
            variant="outlined"
            style={{ color: ratingColor, borderColor: ratingColor }}
        />
    );
}
