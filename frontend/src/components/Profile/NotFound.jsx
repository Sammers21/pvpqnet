import {Box, Typography} from "@mui/material";
import {useParams} from "react-router-dom";
import UpdateButton from './UpdateButton';

const NotFound = ({loading, update}) => {
  let {region, realm, name} = useParams();
  let updButton = <UpdateButton loading={loading} update={() => update()}/>
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
      }}
    >
      <Typography variant="h1" style={{color: 'white'}}>
        404
      </Typography>
      <Typography variant="h3" style={{color: 'white'}}>
        Character {name}-{realm} was not found
      </Typography>
      {updButton}
    </Box>
  );
}

export default NotFound;