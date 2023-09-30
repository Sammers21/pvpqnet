import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import { Alert, Snackbar as MuiSnackbar, styled } from '@mui/material';
import Header from '../../components/AppBar';
import Armory from './Armory';
import Footer from '../../components/common/Footer';

import { baseUrl } from '../../config';
import type { IPlayer } from '../../types';

const Snackbar = styled(MuiSnackbar)({
  borderRadius: 4,
  border: '1px solid #66BB6ACC',

  '& .MuiPaper-root': {
    backgroundColor: '#030303e6',
  },
  '& .MuiAlert-action': {
    display: 'none',
  },
});

const Profile = () => {
  let { region, realm, name } = useParams();
  const [openSnackbar, setOpenSnakbar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState<IPlayer | null>(null);

  useEffect(() => {
    loadProfile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, realm, name]);

  async function loadProfile(update: boolean) {
    setLoading(true);
    const url = baseUrl + `/api/${region}/${realm}/${name}${update ? '/update' : ''}`;
    const response = await axios.get(url, { validateStatus: (status) => status < 500 });

    const data = response.data as IPlayer;
    if (update) setOpenSnakbar(true);

    setLoading(false);
    setPlayer(data);
  }

  return (
    <>
      <Header />
      <div className="flex justify-center w-full min-h-screen pt-24 pb-11 bg-[#030303e6]">
        <div className="w-full px-6 xl:px-0 xl:w-10/12 h-full rounded-lg">
          {player && (
            <Armory player={player} loading={loading} updatePlayer={() => loadProfile(true)} />
          )}
        </div>

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={2000}
          open={openSnackbar}
          onClose={() => setOpenSnakbar(false)}
        >
          <Alert onClose={() => setOpenSnakbar(false)} severity="success">
            Player profile successfully updated!
          </Alert>
        </Snackbar>
      </div>
      <Footer />
    </>
  );
};

export default Profile;
