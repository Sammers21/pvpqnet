import { Grid } from '@mui/material';
import Routes from './routes';
import { styled } from '@mui/system';

const AppContainer = styled(Grid)({
  position: 'relative',
  width: '100vw',
  height: '100vh',
});

function App() {
  return (
    // <AppContainer>
    <Routes />
    // </AppContainer>
  );
}

export default App;
