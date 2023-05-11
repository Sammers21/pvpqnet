import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

const BlizzardLoader = () => {
  return (
    <Grid
      className="loader-container"
      direction="column"
      sx={{ position: 'absolute', display: 'flex' }}
    >
      <div className="loader">
        <div className="blizzard-loader one"></div>
        <div className="blizzard-loader two"></div>
        <div className="blizzard-loader three"></div>
      </div>
      <Typography component="span">LOADING...</Typography>
    </Grid>
  );
};

export default BlizzardLoader;