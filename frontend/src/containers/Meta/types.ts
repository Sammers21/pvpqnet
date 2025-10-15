export type IFilterValue = Record<string, string>;

export interface IMetaFilter {
  title: string;
  name: TFilterName;
  options: string[];
}

export type TFilterName = 'bracket' | 'period' | 'role';
