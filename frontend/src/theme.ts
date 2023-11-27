import { createTheme } from '@mui/material/styles';

export const headerButtonColor = 'rgb(96 165 250)';
export const containerBg = '#030303e6';
export const borderColor = '#2f384de6';
export const aroundColor = 'rgb(47,56,77)';
export const borderRadius = 4;

export const winRateGreyColor = 'rgb(75, 85, 99)';

const appTheme = createTheme({
  palette: {
    primary: {
      light: '#757ce8',
      main: '#60A5FACC',
      dark: '#002884',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
    mode: 'dark',
  },
});

export default appTheme;
