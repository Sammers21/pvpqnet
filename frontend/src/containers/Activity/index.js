import React from 'react';
import { Box } from '@mui/material';

import PageHeader from '../../components/AppBar';
import ActivityTabs from '../../components/Tabs';
import DataTable from '../../components/DataTable';

function Activity() {
  return (
    <>
      <PageHeader />

      <Box sx={{ width: '85%', margin: '60px auto 0 auto' }}>
        <ActivityTabs />
        <DataTable />
      </Box>
    </>
  );
}

export default Activity;
