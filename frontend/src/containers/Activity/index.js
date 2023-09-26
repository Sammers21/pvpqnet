import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mui/material';

import Header from '../../components/Header';
import ActivityTabs from '../../components/Tabs';
import DataTable from '../../components/DataTable';
import Footer from '../../components/Footer';

import { REGIONS } from '../../constants/region';
import { BRACKETS } from '../../constants/pvp-activity';
import { getActivityFromUrl } from '../../utils/urlparts';
import { capitalizeFirstLetter } from '../../utils/common';

function Activity() {
  const { region = REGIONS.eu, bracket = BRACKETS.shuffle } = useParams();
  const activity = getActivityFromUrl();
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    window.addEventListener('resize', function () {
      setWidth(window.innerWidth);
    });
    return () => {
      window.removeEventListener('resize', function () {
        setWidth(window.innerWidth);
      });
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
      <Header />
      <Box sx={{ width: realw, margin: margin }}>
        <ActivityTabs />
        <DataTable />
      </Box>
      <Footer />
    </>
  );
}

export default Activity;
