import React from 'react';
import { Box } from '@mui/material';

import PageHeader from '../../components/AppBar';
import ActivityTabs from '../../components/Tabs';

function Activity() {
  return (
    <>
      <PageHeader />

      <Box sx={{ width: '85%', margin: '120px auto 0 auto' }}>
        <ActivityTabs />
      </Box>
    </>
  );
}

export default Activity;
