import { useMemo } from 'react';
import { createBreakpoint } from 'react-use';

import Table from './Table';
import { tableColumns } from './columns';
import type { IAlt } from '../../../types';

type TPvpBracket = 'SHUFFLE' | 'ARENA_2v2' | 'ARENA_3v3' | 'BATTLEGROUNDS';
const bracketsList: TPvpBracket[] = ['SHUFFLE', 'ARENA_2v2', 'ARENA_3v3', 'BATTLEGROUNDS'];

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const Alts = ({ alts }: { alts?: IAlt[] }) => {
  const breakpoints = useBreakpoint();

  const sortableAlts = useMemo(() => {
    if (!alts) return [];

    return alts.map((alt) => {
      const altCopy = structuredClone(alt);

      altCopy.brackets?.forEach((bracket) => {
        const isShuffle = bracket.bracket_type.startsWith('SHUFFLE');

        if (isShuffle) altCopy['SHUFFLE'] = Math.max(altCopy['SHUFFLE'] || 0, bracket.rating);
        else altCopy[bracket.bracket_type as TPvpBracket] = bracket.rating;
      });

      bracketsList.forEach((bracket) => {
        if (!altCopy[bracket]) altCopy[bracket] = 0;
      });
      return altCopy;
    });
  }, [alts]);

  if (!sortableAlts.length) return null;

  return (
    <div className="flex flex-col md:px-3 py-4 border border-solid border-[#37415180] rounded-lg bg-[#030303e6]">
      <span className="text-2xl px-3 md:px-0">Alts</span>

      <hr className="h-px md:my-2 bg-[#37415180] border-0" />

      <Table
        columns={tableColumns(breakpoints === 'sm')}
        records={sortableAlts}
        isMobile={breakpoints === 'sm'}
      />
    </div>
  );
};

export default Alts;
