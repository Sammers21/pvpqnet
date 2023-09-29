import LastUpdated from './LastUpdated';
import PlayerCard from './PlayerCard';
import PvpBrackets from './PvpBrackets';

import type { IPlayer } from '../../types';
import TitlesHistory from './TitlesHistory';

interface IProps {
  player: IPlayer;
  loading: boolean;
  updatePlayer: () => void;
}

const Armory = ({ player, loading, updatePlayer }: IProps) => {
  return (
    <div className="flex gap-4 rounded-lg">
      <div className="flex flex-col gap-4" style={{ maxWidth: 300, minWidth: 275 }}>
        <PlayerCard player={player} />
        <TitlesHistory player={player} />
      </div>

      <div className="flex flex-col gap-2 grow rounded-lg">
        <LastUpdated player={player} updatePlayer={updatePlayer} loading={loading} />

        <PvpBrackets player={player} />
      </div>
    </div>
  );
};

export default Armory;