import {Box, Typography} from "@mui/material";
import {useParams} from "react-router-dom";

const NotFound = () => {
  let {region, realm, name} = useParams();
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
    </Box>
  );
}

export default NotFound;