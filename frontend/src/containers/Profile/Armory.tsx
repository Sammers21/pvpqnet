import LastUpdated from './LastUpdated';
import PlayerCard from './PlayerCard';
import type { IPlayer } from '../../types';

interface IProps {
  player: IPlayer;
  loading: boolean;
  updatePlayer: () => void;
}

const Armory = ({ player, loading, updatePlayer }: IProps) => {
  console.log('player', player);

  return (
    <div className="flex gap-4 rounded-lg">
      <PlayerCard player={player} />

      <div className="flex flex-col grow rounded-lg">
        <LastUpdated player={player} updatePlayer={updatePlayer} loading={loading} />

        <div>Seaction content</div>
      </div>
    </div>
  );
};

export default Armory;
