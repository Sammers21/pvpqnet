import { useParams } from "react-router-dom";

import { Button, CircularProgress, Typography } from "@mui/material";

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
        <Button variant="outlined" disabled startIcon={<CircularProgress size={18} thickness={5} />}>
          Updating
        </Button>
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
    <div className="flex flex-col justify-center text-center items-center min-h-screen pt-16">
      <Typography variant="h1">404</Typography>
      <Typography variant="h4">
        Character {name}-{realm} was not found
      </Typography>
      <UpdateButton loading={loading} updatePlayer={updatePlayer} />
    </div>
  );
};

export default PlayerNotFound;
