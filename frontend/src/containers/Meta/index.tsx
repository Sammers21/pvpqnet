import { useEffect } from 'react';
import AppBar from '@/components/Header';
import Footer from '@/components/Footer';

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
