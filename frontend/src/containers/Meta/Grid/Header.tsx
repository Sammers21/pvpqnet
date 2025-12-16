import { Typography } from '@mui/material';

const Header = () => {
  return (
    <div className="mx-2 my-2 px-4 py-4 rounded-2xl bg-[#2f384d4d]">
      <Typography variant="h4">Meta</Typography>
      <Typography variant="body1">
        Specs Popularity and Win rates, last month, last week, last day, any skill level, any role
        and any bracket
      </Typography>
    </div>
  );
};

export default Header;
