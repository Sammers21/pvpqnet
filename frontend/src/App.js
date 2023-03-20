import Routes from './routes';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import AppBar from './components/AppBar';
import appTheme from './theme';

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppBar />
      <Routes />
    </ThemeProvider>
  );
}

export default App;
