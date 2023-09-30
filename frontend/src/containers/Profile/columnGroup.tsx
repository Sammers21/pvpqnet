import { getAltProfileUrl, getClassNameColor, getSpecIcon, ratingToColor } from '../../utils/table';
import type { IPlayer } from '../../types';
import type { GridColDef } from '@mui/x-data-grid';
import { CLASS_AND_SPECS } from '../../constants/filterSchema';
import { Avatar, Chip } from '@mui/material';

interface IParams {
  row: IPlayer;
}

const renderName = ({ row: alt }: IParams) => {
  const name = alt.name;
  const realm = alt.realm;
  const url = getAltProfileUrl(alt);

  return (
    <div className="flex items-center">
      <span color={getClassNameColor(alt.class)}>
        <a
          className="text-base no-underline"
          href={url}
          style={{ color: getClassNameColor(alt.class) }}
        >
          {name}-{realm}
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

const renderShuffle = ({ row: alt }: IParams) => {
  // @ts-ignore
  const classAndSpec = CLASS_AND_SPECS[alt.class] as string[];

  return (
    <div className="flex gap-2">
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

export const tableColumns: GridColDef<IPlayer>[] = [
  {
    field: 'id',
    headerName: 'Name',
    renderCell: renderName,
    width: 200,
    renderHeader: () => renderHeader('Name'),
  },
  {
    field: 'SHUFFLE',
    headerName: 'Shuffle',
    renderCell: (params: IParams) => renderShuffle(params),
    width: 300,
    renderHeader: () => renderHeader('Shuffle'),
  },
  {
    field: 'ARENA_2v2',
    headerName: '2v2',
    renderCell: (params: IParams) => renderBracket(params, '2v2'),
    renderHeader: () => renderHeader('2v2'),
  },
  {
    field: 'ARENA_3v3',
    headerName: '3v3',
    renderCell: (params: IParams) => renderBracket(params, '3v3'),
    renderHeader: () => renderHeader('3v3'),
  },
  {
    field: 'BATTLEGROUNDS',
    headerName: 'RBG',
    renderCell: (params: IParams) => renderBracket(params, 'rbg'),
    renderHeader: () => renderHeader('RBG'),
  },
];
