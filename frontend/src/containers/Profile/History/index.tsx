import { useMemo, useState } from 'react';
import { createBreakpoint } from 'react-use';

import Table from './Table';
import BracketTabs from './BracketTabs';

import type { IPlayer } from '@/types';
import { tableColumns } from './columns';
import { getGamingHistoryRows } from '@/utils/profile';

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const GamingHistory = ({ player }: { player: IPlayer }) => {
  const breakpoints = useBreakpoint();

  const initialBracket = !!player.brackets.find(({ bracket_type }) => bracket_type === 'ARENA_3v3')
    ? 'ARENA_3v3'
    : 'all';

  const [value, setValue] = useState(initialBracket);

  const bracket = useMemo(() => {
    const bracketsList = ['ARENA_2v2', 'ARENA_3v3', 'BATTLEGROUNDS'];
    const search = bracketsList.includes(value) ? value : `SHUFFLE-${value}`;

    return player.brackets.find((history) => history.bracket_type === search);
  }, [player, value]);

  const handleChange = (_evt: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const records = useMemo(() => {
    if (value === 'all') {
      return player.brackets?.flatMap((bracket) => getGamingHistoryRows(bracket));
    }

    return getGamingHistoryRows(bracket);
  }, [player, bracket, value]);

  return (
    <div className="flex flex-col py-2 md:px-3 border border-solid border-[#37415180] rounded-lg bg-[#030303e6] ">
      <div className="flex justify-between items-center px-3 md:px-0">
        <span className="text-2xl mr-4">History</span>
        <BracketTabs player={player} onChange={handleChange} value={value} />
      </div>

      <hr className="h-px md:mb-2 bg-[#37415180] border-0" />

      <Table
        columns={tableColumns(player, value)}
        records={records}
        isMobile={breakpoints === 'sm'}
      />
    </div>
  );
};

export default GamingHistory;
