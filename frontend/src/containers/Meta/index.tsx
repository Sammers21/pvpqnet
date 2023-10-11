import { useEffect } from 'react';

import Grid from './Grid';

const Meta = () => {
  useEffect(() => {
    document.title = `Meta`;
  }, []);

  return <Grid />;
};

export default Meta;
