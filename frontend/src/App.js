import React from 'react';
import AppRoutes from './routes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import appTheme from './theme';

import dayjs from 'dayjs-ext';
import relativeTime from 'dayjs-ext/plugin/relativeTime';

dayjs.extend(relativeTime);

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
