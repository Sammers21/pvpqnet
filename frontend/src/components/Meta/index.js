import Header from '../AppHeader';
import React from 'react';
import Footer from '../common/Footer';
import Grid from './Grid';

const Meta = () => {
  document.title = `Meta`;
  return (
    <>
      <Header />
      <Grid />
      <Footer />
    </>
  );
};

export default Meta;
