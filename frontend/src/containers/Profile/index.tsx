import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import { Alert, Snackbar as MuiSnackbar, styled } from '@mui/material';
import Header from '@/components/AppBar';
import Armory from './Armory';
import PlayerNotFound from './PlayerNotFound';
import Footer from '@/components/common/Footer';

import { baseUrl } from '@/config';
import { capitalizeFirstLetter } from '@/utils/common';
import type { IPlayer } from '@/types';

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
  const [playerStatus, setPlayerStatus] = useState(200);
  const [player, setPlayer] = useState<IPlayer | null>(null);

  useEffect(() => {
    document.title = `${capitalizeFirstLetter(name)}-${capitalizeFirstLetter(
      realm
    )} on ${region?.toUpperCase()}`;
  }, [name, realm, region]);

  useEffect(() => {
    loadProfile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [region, realm, name]);

  async function loadProfile(update: boolean) {
    setLoading(true);
    const url = baseUrl + `/api/${region}/${realm}/${name}${update ? '/update' : ''}`;
    const response = await axios.get(url, { validateStatus: (status) => status < 500 });

    const data = response.data as IPlayer;
    if (update && response.status !== 404) setOpenSnakbar(true);

    setPlayerStatus(response.status);
    setLoading(false);
    setPlayer(data);
  }

  return (
    <>
      <Header />
      {playerStatus === 404 ? (
        <PlayerNotFound loading={loading} updatePlayer={() => loadProfile(true)} />
      ) : (
        <div className="flex justify-center w-full min-h-screen pt-20 md:pt-24 pb-11 bg-[#030303e6]">
          <div className="w-full px-4 xl:px-0 xl:w-10/12 2xl:w-[1180px] h-full rounded-lg">
            {player && (
              <Armory player={player} loading={loading} updatePlayer={() => loadProfile(true)} />
            )}
          </div>
        </div>
      )}

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
      <Footer />
    </>
  );
};

export default Profile;
