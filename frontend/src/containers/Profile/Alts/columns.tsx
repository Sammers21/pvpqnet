import { Avatar, Chip } from '@mui/material';
import type { GridColDef } from '@mui/x-data-grid';

import {
  getAltProfileUrl,
  getClassNameColor,
  getSpecIcon,
  ratingToColor,
} from '../../../utils/table';
import { CLASS_AND_SPECS } from '../../../constants/filterSchema';

import type { IPlayer, IPlayerBracket } from '../../../types';

interface IParams {
  row: IPlayer;
}

const renderName = ({ row: alt }: IParams, isMobile: boolean) => {
  const realm = alt.realm;
  const url = getAltProfileUrl(alt);

  let name = alt.name;
  if (isMobile) {
    const max = Math.round(Math.max(6, 6 + (window.innerWidth - 500) / 30));
    name = `${name.substring(0, max)}...`;
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

const renderBracket = ({ row: alt }: IParams, bracketName: keyof typeof bracketTypeTitleMap) => {
  const bracket = alt?.brackets?.find((br) => br.bracket_type === bracketTypeTitleMap[bracketName]);
  if (!bracket) return <span>0</span>;

  return <span style={{ color: ratingToColor(bracket) }}>{bracket.rating}</span>;
};

const renderShuffle = ({ row: alt }: IParams, isMobile: boolean) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[alt.class] as string[];

  if (isMobile) {
    let max = 0;
    let spec = classAndSpec[0];
    let bracket: IPlayerBracket | null = null;

    classAndSpec.forEach((spec) => {
      const altBracket = alt?.brackets?.find((b) => b.bracket_type.includes(spec));
      if (altBracket?.rating && altBracket.rating > max) {
        max = altBracket.rating;
        bracket = altBracket;
      }
    });
    if (!bracket) return null;

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
      {classAndSpec.map((spec) => {
        const altBracket = alt?.brackets?.find((b) => b.bracket_type.includes(spec));
        if (!altBracket?.rating) return null;

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

const renderHeader = (title: string) => {
  return <span className="text-base text-center">{title}</span>;
};

export const tableColumns = (isMobile: boolean): GridColDef<IPlayer>[] => [
  {
    field: 'id',
    headerName: 'Name',
    width: isMobile ? 80 : 200,
    renderCell: (params: IParams) => renderName(params, isMobile),
    renderHeader: () => renderHeader('Name'),
  },
  {
    field: 'SHUFFLE',
    headerName: 'Shuffle',
    renderCell: (params: IParams) => renderShuffle(params, isMobile),
    width: isMobile ? 100 : 300,
    renderHeader: () => renderHeader('Shuffle'),
  },
  {
    field: 'ARENA_2v2',
    headerName: '2v2',
    width: isMobile ? 50 : 80,
    renderCell: (params: IParams) => renderBracket(params, '2v2'),
    renderHeader: () => renderHeader('2v2'),
  },
  {
    field: 'ARENA_3v3',
    headerName: '3v3',
    width: isMobile ? 50 : 80,
    renderCell: (params: IParams) => renderBracket(params, '3v3'),
    renderHeader: () => renderHeader('3v3'),
  },
  {
    field: 'BATTLEGROUNDS',
    headerName: 'RBG',
    width: isMobile ? 50 : 80,
    renderCell: (params: IParams) => renderBracket(params, 'rbg'),
    renderHeader: () => renderHeader('RBG'),
  },
];
