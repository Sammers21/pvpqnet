import { useParams } from 'react-router-dom';

import { Button, Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import SaveIcon from '@mui/icons-material/Save';

const UpdateButton = ({
  loading,
  updatePlayer,
}: {
  loading: boolean;
  updatePlayer: () => void;
}) => {
  return (
    <div className="pt-4">
      {loading ? (
        <LoadingButton loading loadingPosition="start" startIcon={<SaveIcon />} variant="outlined">
          Updating
        </LoadingButton>
      ) : (
        <Button variant="contained" onClick={updatePlayer}>
          Update player data
        </Button>
      )}
    </div>
  );
};

const PlayerNotFound = ({
  loading,
  updatePlayer,
}: {
  loading: boolean;
  updatePlayer: () => void;
}) => {
  let { realm, name } = useParams();

  return (
    <div className="flex flex-col justify-center text-center items-center min-h-screen bg-[#030303e6]">
      <Typography variant="h1">404</Typography>
      <Typography variant="h4">
        Character {name}-{realm} was not found
      </Typography>
      <UpdateButton loading={loading} updatePlayer={updatePlayer} />
    </div>
  );
};

export default PlayerNotFound;
