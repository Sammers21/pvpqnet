import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import PageHeader from '../../components/AppBar';
import ActivityTabs from '../../components/Tabs';
import DataTable from '../../components/DataTable';

import { REGIONS } from '../../constants/region';
import { DISCIPLINES } from '../../constants/pvp-activity';

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

function Activity() {
  const {
    region = REGIONS.eu,
    activity = 'activity',
    discipline = DISCIPLINES.shuffle,
  } = useParams();

  useEffect(() => {
    console.log('change');
    const title = `${capitalizeFirstLetter(discipline)} ${capitalizeFirstLetter(
      activity
    )} on ${region.toUpperCase()}`;

    document.title = title;
  }, [region, activity, discipline]);

  return (
    <>
      <PageHeader />

      <Box sx={{ width: '85%', margin: '45px auto 45px auto' }}>
        <ActivityTabs />
        <DataTable />
      </Box>
    </>
  );
}

export default Activity;
