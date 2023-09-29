import LastUpdated from './LastUpdated';
import PlayerCard from './PlayerCard';
import PvpBrackets from './PvpBrackets';

import type { IPlayer } from '../../types';

interface IProps {
  player: IPlayer;
  loading: boolean;
  updatePlayer: () => void;
}

const Armory = ({ player, loading, updatePlayer }: IProps) => {
  return (
    <div className="flex gap-4 rounded-lg">
      <PlayerCard player={player} />

      <div className="flex flex-col gap-2 grow rounded-lg">
        <LastUpdated player={player} updatePlayer={updatePlayer} loading={loading} />

        <PvpBrackets player={player} />
      </div>
    </div>
  );
};

export default Armory;
