import { useEffect } from 'react';
import AppBar from '@/components/AppBar';
import Footer from '@/components/common/Footer';

import Grid from './Grid';

const Meta = () => {
  useEffect(() => {
    document.title = `Meta`;
  }, []);

  return (
    <>
      <AppBar />
      <Grid />
      <Footer />
    </>
  );
};

export default Meta;
