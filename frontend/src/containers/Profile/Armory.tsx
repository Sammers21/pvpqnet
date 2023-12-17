import { createBreakpoint } from 'react-use';

import PlayerHeader from './PlayerHeader';
import PlayerDesktop from './PlayerCard/Desktop';
import PlayerMobile from './PlayerCard/Modile';
import PvpBrackets from './PvpBrackets';

import TitlesHistory from './TitlesHistory';
import AltsTable from './Alts';
import GamingHistory from './History';

import type { IPlayer } from '@/types';

interface IProps {
  player: IPlayer;
  loading: boolean;
  updatePlayer: () => void;
}

const useBreakpoint = createBreakpoint({ md: 768, lg: 1024 });
const Armory = ({ player, loading, updatePlayer }: IProps) => {
  const breakpoint = useBreakpoint();

  return (
    <div className="flex flex-col lg:flex-row gap-2 md:gap-4 rounded-lg">
      {breakpoint === 'lg' && (
        <div className="flex flex-col gap-2 md:gap-4 lg:w-[300px] lg:min-w-[300px]">
          <PlayerDesktop player={player} />
          <TitlesHistory player={player} />
        </div>
      )}

      <div
        className="flex flex-col gap-2 grow lg:self-start rounded-lg"
        style={breakpoint === 'lg' ? { maxWidth: 'calc(100% - 300px)' } : {}}
      >
        {breakpoint === 'md' && <PlayerMobile player={player} />}
        <PlayerHeader player={player} updatePlayer={updatePlayer} loading={loading} />
        <PvpBrackets player={player} />
        <AltsTable player={player} />
        {player.brackets.find((bracket) => bracket.gaming_history.history.length > 0) && (<GamingHistory player={player} />)}
        {breakpoint === 'md' && <TitlesHistory player={player} />}
      </div>
    </div>
  );
};

export default Armory;
