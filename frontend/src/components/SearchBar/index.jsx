import React from 'react';
import {Autocomplete, TextField} from '@mui/material';
const SearchBar = () => {
  return (<Autocomplete
    sx={{
      display: "inline-flex",
      width: 300,
    }}
    disablePortal
    options={["123"]}
    id="combo-box-demo"
    renderInput={(params) => {
      console.log(params)
      return (<TextField {...params}
                         label="Seach for characters..."
                         size="small"
                         inputProps={{...params.inputProps,
                           backgroundColor: "rgb(156 163 175 / .25)"}}
      />);
    }}
  />);

//
};
export default SearchBar;
