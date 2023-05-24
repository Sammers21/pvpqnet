import React, {useCallback, useEffect, useMemo} from 'react';
import {useState} from 'react';
import _debounce from 'lodash/debounce';
import {Autocomplete, TextField} from '@mui/material';
import axios from 'axios';
import {baseUrl} from "../../config";

const SearchBar = () => {
  // Tiny delay to prevent spamming the API
  const delayMs = 100;
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const search = async (q) => {
    if (q === '') {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    const response = await axios.get(baseUrl + "/api/search", {
      params: {
        q: q,
      }
    });
    let unique = [...new Set(response.data)];
    setSearchResults(unique);
    console.log("search results:", response.data);
    setLoading(false);
  }
  const throttle = useCallback(_debounce(search, delayMs), []);
  useEffect(() => {
    throttle(inputValue);
  }, [inputValue]);

  return (<Autocomplete
    sx={{
      display: "inline-flex",
      marginTop: 1,
      width: 300,
    }}
    disablePortal
    noOptionsText="No results"
    options={searchResults}
    getOptionLabel={(option) => option.nick}
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
