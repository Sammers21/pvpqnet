import PlayerHeader from './PlayerHeader';
import PlayerCard from './PlayerCard';
import PvpBrackets from './PvpBrackets';

import type { IPlayer } from '../../types';
import TitlesHistory from './TitlesHistory';
import AltsTable from './AltsTable';

interface IProps {
  player: IPlayer;
  loading: boolean;
  updatePlayer: () => void;
}

const Armory = ({ player, loading, updatePlayer }: IProps) => {
  return (
    <div className="flex gap-4 rounded-lg">
      <div className="flex flex-col gap-4" style={{ maxWidth: 300, minWidth: 250 }}>
        <PlayerCard player={player} />
        <TitlesHistory player={player} />
      </div>

      <div className="flex self-start flex-col gap-2 grow rounded-lg">
        <PlayerHeader player={player} updatePlayer={updatePlayer} loading={loading} />

        <PvpBrackets player={player} />

        <AltsTable alts={player.alts} />
      </div>
    </div>
  );
};

export default Armory;
