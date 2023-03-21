import React from 'react';
import { Grid, CircularProgress } from '@mui/material';

const Loader = ({ withBackdrop, size = 40, color }) => {
  return (
    <Grid container justifyContent="center" alignItems="center">
      <CircularProgress size={size} />
    </Grid>
  );
};

const Loading = (props) => <Loader {...props} />;

export default Loading;
