import { Grid, CircularProgress } from '@mui/material';

const Loading = ({ size = 40 }) => {
  return (
    <Grid container justifyContent="center" alignItems="center">
      <CircularProgress size={size} />
    </Grid>
  );
};

export default Loading;
