import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';

import PageHeader from '../../components/common/PageHeader';
import Footer from '../../components/common/Footer';

import Tabs from '../../components/TablePageFeatures/Tabs';
import DataTable from '../../components/TablePageFeatures/DataTable';

import { capitalizeFirstLetter } from '../../utils/capitalizeFirstLetter';
import { REGION, BRACKET } from '../../constants';

function Activity() {
  const { region = REGION.eu, activity = 'activity', bracket = BRACKET.shuffle } = useParams();

  const [width, setWidth] = useState(window.innerWidth);

  function handleWindowSizeChange() {
    setWidth(window.innerWidth);
  }
  useEffect(() => {
    window.addEventListener('resize', handleWindowSizeChange);
    return () => {
      window.removeEventListener('resize', handleWindowSizeChange);
    };
  }, []);

  const isMobile = width <= 900;

  useEffect(() => {
    const title = `${capitalizeFirstLetter(bracket)} ${capitalizeFirstLetter(
      activity
    )} on ${region.toUpperCase()}`;

    document.title = title;
  }, [region, activity, bracket]);
  let realw = isMobile ? '100%' : '85%';
  let margin = '95px auto 45px auto';
  return (
    <>
      <PageHeader />
      <Box sx={{ width: realw, margin: margin }}>
        <Tabs />
        <DataTable />
      </Box>
      <Footer />
    </>
  );
}

export default Activity;
