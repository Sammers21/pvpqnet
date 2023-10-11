import { Avatar, Chip } from '@mui/material';

import { getAltProfileUrl, getClassNameColor, getSpecIcon, ratingToColor } from '@/utils/table';
import { CLASS_AND_SPECS } from '@/constants/filterSchema';

import type { IAlt, IPlayerBracket, ITableColumn } from '@/types';

interface IParams {
  record: IAlt;
}

const renderName = ({ record: alt }: IParams, isMobile: boolean) => {
  const realm = alt.realm;
  const url = getAltProfileUrl(alt);

  let name = alt.name;
  if (isMobile) {
    const max = Math.round(Math.max(6, 6 + (window.innerWidth - 500) / 30));
    name = `${name.substring(0, max)}`;
  }

  return (
    <div className="flex items-center">
      <span color={getClassNameColor(alt.class)}>
        <a
          className="text-base no-underline"
          href={url}
          style={{ color: getClassNameColor(alt.class) }}
        >
          {name}
          {!isMobile && `-${realm}`}
        </a>
      </span>
    </div>
  );
};

const bracketTypeTitleMap = {
  '2v2': 'ARENA_2v2',
  '3v3': 'ARENA_3v3',
  rbg: 'BATTLEGROUNDS',
};

const renderBracket = ({ record: alt }: IParams, bracketName: keyof typeof bracketTypeTitleMap) => {
  const bracket = alt?.brackets?.find((br) => br.bracket_type === bracketTypeTitleMap[bracketName]);
  if (!bracket) return <span>0</span>;

  return <span style={{ color: ratingToColor(bracket) }}>{bracket.rating}</span>;
};

const renderShuffle = ({ record: alt }: IParams, isMobile: boolean) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[alt.class] as string[];

  const sortedSpec = [...classAndSpec].sort((a, b) => {
    const ratingA = alt?.brackets?.find((bracket) => bracket.bracket_type.includes(a))?.rating || 0;
    const ratingB = alt?.brackets?.find((bracket) => bracket.bracket_type.includes(b))?.rating || 0;

    return ratingA > ratingB ? -1 : 1;
  });

  if (isMobile) {
    let max = 0;
    let spec = sortedSpec[0];
    let bracket: IPlayerBracket | null = null;

    sortedSpec.forEach((spec) => {
      const altBracket = alt?.brackets?.find((b) => b.bracket_type.includes(spec));
      if (altBracket?.rating && altBracket.rating > max) {
        max = altBracket.rating;
        bracket = altBracket;
      }
    });
    if (!bracket) return <></>;

    const specIcon = getSpecIcon(`${spec} ${alt.class}` || '');
    const ratingColor = ratingToColor(bracket);
    return (
      <Chip
        avatar={<Avatar alt="class" src={specIcon} />}
        label={(bracket as any).rating}
        variant="outlined"
        style={{ color: ratingColor, borderColor: ratingColor }}
      />
    );
  }

  return (
    <div className="flex md:gap-2">
      {sortedSpec.map((spec) => {
        const altBracket = alt?.brackets?.find((b) => b.bracket_type.includes(spec));
        if (!altBracket?.rating) return <></>;

        const specIcon = getSpecIcon(`${spec} ${alt.class}` || '');
        const ratingColor = ratingToColor(altBracket);
        return (
          <Chip
            avatar={<Avatar alt="class" src={specIcon} />}
            label={altBracket?.rating}
            variant="outlined"
            style={{ color: ratingColor, borderColor: ratingColor }}
          />
        );
      })}
    </div>
  );
};

export const tableColumns = (isMobile: boolean): ITableColumn[] => [
  {
    field: 'name',
    label: 'Name',
    render: (params: IParams) => renderName(params, isMobile),
  },
  {
    field: 'SHUFFLE',
    label: 'Shuffle',
    render: (params: IParams) => renderShuffle(params, isMobile),
  },
  {
    field: 'ARENA_2v2',
    label: '2v2',
    render: (params: IParams) => renderBracket(params, '2v2'),
  },
  {
    field: 'ARENA_3v3',
    label: '3v3',
    render: (params: IParams) => renderBracket(params, '3v3'),
  },
  {
    field: 'BATTLEGROUNDS',
    label: 'RBG',
    render: (params: IParams) => renderBracket(params, 'rbg'),
  },
];
