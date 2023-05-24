import React from 'react';
import {Autocomplete, TextField} from '@mui/material';
const SearchBar = () => {
  const [inputValue, setInputValue] = React.useState('');
  return (<Autocomplete
    sx={{
      display: "inline-flex",
      width: 300,
    }}
    disablePortal
    options={["123"]}
    onInputChange={(event, newInputValue) => {
      console.log("input change:", newInputValue)
      setInputValue(newInputValue);
    }}
    renderInput={(params) => {
      return (<TextField {...params} label="Seach for characters..." size="small"/>);
    }}
  />);
};
export default SearchBar;
