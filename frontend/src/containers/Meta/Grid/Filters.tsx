import { aroundColor } from '@/theme';
import { Select, InputLabel, FormControl, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { alpha } from '@mui/material/styles';

import type { IFilterValue, IMetaFilter } from '../types';

interface ISelectProps {
  filter: IMetaFilter;
  onChange: (evt: SelectChangeEvent, name: string) => void;
  value: string;
}

const FilterSelect = ({ onChange, filter, value }: ISelectProps) => {
  return (
    <FormControl sx={{ m: 1, minWidth: 110, backgroundColor: alpha(aroundColor, 0.3) }}>
      <InputLabel id="per-l">{filter.title}</InputLabel>
      <Select
        labelId="per-l"
        id="per"
        autoWidth
        value={value}
        label={filter.title}
        onChange={(evt) => onChange(evt, filter.name)}
      >
        {filter.options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

interface IFiltersProps {
  filters: IMetaFilter[];
  onChange: (value: string, filterName: string) => void;
  values: IFilterValue;
}

const Filters = ({ onChange, filters, values }: IFiltersProps) => {
  const handleChange = (evt: SelectChangeEvent, filterName: string) => {
    onChange(evt.target.value, filterName);
  };

  return (
    <div className="mx-2 my-2 px-4 py-4 rounded">
      {filters.map((filter) => (
        <FilterSelect
          key={filter.name}
          filter={filter}
          onChange={handleChange}
          value={values[filter.name]}
        />
      ))}
    </div>
  );
};

export default Filters;
