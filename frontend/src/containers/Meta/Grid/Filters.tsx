import { aroundColor } from "@/theme";
import { Select, InputLabel, FormControl, MenuItem, Box } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import SportsMmaIcon from "@mui/icons-material/SportsMma";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SecurityIcon from "@mui/icons-material/Security";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import LooksTwoIcon from "@mui/icons-material/LooksTwo";
import Looks3Icon from "@mui/icons-material/Looks3";
import FlagIcon from "@mui/icons-material/Flag";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DateRangeIcon from "@mui/icons-material/DateRange";
import TodayIcon from "@mui/icons-material/Today";
import CalendarViewMonthIcon from "@mui/icons-material/CalendarViewMonth";

import type { IFilterValue, IMetaFilter } from "../types";

interface ISelectProps {
  filter: IMetaFilter;
  onChange: (evt: SelectChangeEvent, name: string) => void;
  value: string;
}

const roleIconFor = (option: string) => {
  switch (option.toLowerCase()) {
    case "all":
      return <AllInclusiveIcon fontSize="small" />;
    case "melee":
      return <SportsMmaIcon fontSize="small" />;
    case "ranged":
      return <GpsFixedIcon fontSize="small" />;
    case "dps":
      return <WhatshotIcon fontSize="small" />;
    case "healer":
      return <LocalHospitalIcon fontSize="small" />;
    case "tank":
      return <SecurityIcon fontSize="small" />;
    default:
      return null;
  }
};

const bracketIconFor = (option: string) => {
  switch (option.toLowerCase()) {
    case "shuffle":
      return <ShuffleIcon fontSize="small" />;
    case "2v2":
      return <LooksTwoIcon fontSize="small" />;
    case "3v3":
      return <Looks3Icon fontSize="small" />;
    case "battlegrounds":
      return <FlagIcon fontSize="small" />;
    case "blitz":
      return <FlashOnIcon fontSize="small" />;
    default:
      return null;
  }
};

const periodIconFor = (option: string) => {
  switch (option.toLowerCase()) {
    case "last month":
      return <CalendarMonthIcon fontSize="small" />;
    case "last week":
      return <DateRangeIcon fontSize="small" />;
    case "last day":
      return <TodayIcon fontSize="small" />;
    case "this season":
      return <CalendarViewMonthIcon fontSize="small" />;
    default:
      return null;
  }
};

const FilterSelect = ({ onChange, filter, value }: ISelectProps) => {
  return (
    <FormControl
      sx={{ m: 1, minWidth: 110, backgroundColor: alpha(aroundColor, 0.3) }}
    >
      <InputLabel id="per-l">{filter.title}</InputLabel>
      <Select
        labelId="per-l"
        id="per"
        autoWidth
        value={value}
        label={filter.title}
        onChange={(evt) => onChange(evt, filter.name)}
        renderValue={(selected) => (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Box sx={{ mr: 1 }}>
              {filter.name === "role" && roleIconFor(String(selected))}
              {filter.name === "bracket" && bracketIconFor(String(selected))}
              {filter.name === "period" && periodIconFor(String(selected))}
            </Box>
            {String(selected)}
          </Box>
        )}
      >
        {filter.options.map((option) => (
          <MenuItem key={option} value={option}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box sx={{ mr: 1 }}>
                {filter.name === "role" && roleIconFor(option)}
                {filter.name === "bracket" && bracketIconFor(option)}
                {filter.name === "period" && periodIconFor(option)}
              </Box>
              {option}
            </Box>
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
