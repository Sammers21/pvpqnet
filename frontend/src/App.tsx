import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs-ext';
// @ts-ignore
import relativeTime from 'dayjs-ext/plugin/relativeTime';

import AppRoutes from './routes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import appTheme from './theme';
import ServerStatusPopup from './components/ServerStatusPopup';

dayjs.extend(relativeTime);

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
        <ServerStatusPopup />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
