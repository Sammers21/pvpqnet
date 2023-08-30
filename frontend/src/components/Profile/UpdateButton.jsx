import LoadingButton from '@mui/lab/LoadingButton';
import { Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

const UpdateButton = ({loading, update}) => {
  let updButton;
  if (loading) {
    updButton = <LoadingButton sx={{p: 1, marginTop: 1,}} loading loadingPosition="start" startIcon={<SaveIcon/>} variant="outlined">Updating</LoadingButton>
  } else {
    updButton = <Button sx={{p: 1, marginTop: 1,}} variant="contained" onClick={() => update()}>Update now</Button>;
  }
  return updButton;
} 

export default UpdateButton;