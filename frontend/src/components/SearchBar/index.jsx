import React, {useCallback, useEffect, useMemo} from 'react';
import {useState} from 'react';
import _debounce from 'lodash/debounce';
import {Autocomplete, Box, Grid, TextField, Typography} from '@mui/material';
import axios from 'axios';
import {baseUrl} from "../../config";
import {classIcon, getClassNameColor} from "../DataTable/useColumns"
import {EuIcon, UsIcon} from "../icons";

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
    renderOption={(props, option, state) => {
      const icon = classIcon(option.class);
      let regionIcon;
      if (option.region === "US") {
        regionIcon = <UsIcon color="red" />;
      } else {
        regionIcon = <EuIcon/>;
      }
      const capitalize = s => s && s[0].toUpperCase() + s.slice(1)
      const split = option.nick.split("-");
      const realm = capitalize(split[1]);
      const name = capitalize(split[0]);
      const fullNick = `${name}-${realm}`;
      return (<li {...props}>
        <Grid sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <Grid sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-start',
          }}>
            <img
              style={{
                border: '1px #37415180 solid',
                borderRadius: '4px',
                height: '25px',
                width: '25px',
              }}
              src={icon}
            />
            <Typography color={getClassNameColor(option.class)} sx={{marginLeft: '10px'}}>
              {fullNick}
            </Typography>
          </Grid>
          <Box>{regionIcon}</Box>
        </Grid>
      </li>);
    }}
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
