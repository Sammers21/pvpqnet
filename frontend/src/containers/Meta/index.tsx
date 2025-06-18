import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

import Grid from './Grid';

const Meta = () => {
  useEffect(() => {
    document.title = `Meta`;
  }, []);

  return (
    <>
      <Grid />
    </>
  );
};

export default Meta;
