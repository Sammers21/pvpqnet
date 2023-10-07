import { createBreakpoint } from 'react-use';

import { Divider } from '@mui/material';

import Table from './Table';
import { tableColumns } from './columns';
import type { IPlayer } from '../../../types';

const useBreakpoint = createBreakpoint({ sm: 640, md: 768, lg: 1024 });

const Alts = ({ alts }: { alts?: IPlayer[] }) => {
  const breakpoints = useBreakpoint();

  if (!alts || !alts.length) return null;

  const explodedAlts = alts?.map((alt) => {
    alt.brackets?.forEach((bracket) => {
      if (bracket.bracket_type.startsWith('SHUFFLE')) {
        const cur = alt['SHUFFLE'] || 0;
        alt['SHUFFLE'] = Math.max(cur, bracket.rating);
      } else {
        // @ts-ignore
        alt[bracket.bracket_type] = bracket.rating;
      }
    });
    ['SHUFFLE', 'ARENA_2v2', 'ARENA_3v3', 'BATTLEGROUNDS'].forEach((bracket) => {
      // @ts-ignore
      if (!alt[bracket]) alt[bracket] = 0;
    });
    return alt;
  });

  return (
    <div className="flex flex-col border border-solid rounded-lg border-[#37415180] md:px-3 py-4 bg-[#030303e6]">
      <span className="text-2xl px-3 md:px-0">Alts</span>

      <Divider className="md:!my-2" />

      <Table
        columns={tableColumns(breakpoints === 'sm')}
        records={explodedAlts}
        isMobile={breakpoints === 'sm'}
      />
    </div>
  );
};

export default Alts;
