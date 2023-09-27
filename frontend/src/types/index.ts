interface IAcitivityCharacter {
  class: string;
  full_spec: string;
  race: string;
  gender: string;
  pos: number;
  rating: number;
  in_cutoff: boolean;
  name: string;
  fraction: string;
  realm: string;
  wins: number;
  losses: number;
}

interface IActivityDiff {
  won: number;
  lost: number;
  rating_diff: number;
  rank_diff: number;
  last_seen?: string;
}

export interface IActivityRecord extends IAcitivityCharacter {
  character: IAcitivityCharacter;
  diff: IActivityDiff;
}

export interface ITableColumn {
  field: string;
  label: string;
  align?: 'right' | 'left';
  render: ({ record }: { record: IActivityRecord }) => JSX.Element;
}
