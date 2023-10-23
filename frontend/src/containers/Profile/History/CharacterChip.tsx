import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Avatar, Chip } from '@mui/material';
import { capitalizeFirstLetter } from '@/utils/common';
import { getSpecIcon, ratingToColor } from '@/utils/table';

const CharacterChip = ({ char, region, show_nick = false }) => {
  let navigate = useNavigate();
  const label = useMemo(() => {
    return show_nick ? capitalizeFirstLetter(char.name) : char.rating;
  }, [char, show_nick]);

  const specIcon = getSpecIcon(`${char.full_spec}` || '');
  const ratingColor = char.pos === -1 ? 'white' : ratingToColor(char.rating);

  return (
    <div onClick={() => navigate(`/${region}/${char.realm}/${char.name}`)}>
      <Chip
        className="!cursor-pointer"
        avatar={<Avatar alt="class" src={specIcon} />}
        label={label}
        variant="outlined"
        style={{ color: ratingColor, borderColor: ratingColor }}
      />
    </div>
  );
};

export default CharacterChip;
