import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import Header from '../../components/AppBar';
import Footer from '../../components/common/Footer';
import { baseUrl } from '../../config';

import Armory from './Armory';
import { IPlayer } from '../../types';

const Profile = () => {
  let { region, realm, name } = useParams();
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
      </div>
      <Footer />
    </>
  );
};

export default Profile;
