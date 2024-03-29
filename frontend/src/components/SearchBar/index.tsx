import { useState } from 'react';
import { useDebounce } from 'react-use';
import { useNavigate } from 'react-router-dom';
import { uniqBy } from 'lodash';

import { Autocomplete, InputAdornment, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { getClassIcon, getClassNameColor } from '@/utils/table';
import { EuIcon, UsIcon } from '../IIcons';

import { searchPlayers } from '@/services/stats.service';
import { capitalizeNickname } from '@/utils/urlparts';
import { capitalizeFirstLetter } from '@/utils/common';

interface ISearchResults {
  nick: string;
  region: string;
  class: string;
}

const renderSearchOption = (props: React.HTMLAttributes<HTMLLIElement>, option: ISearchResults) => {
  const icon = getClassIcon(option.class);
  const RegionIcon = option.region === 'us' || option.region === 'en-us' ? UsIcon : EuIcon;
  var fullNick = capitalizeNickname(option.nick);
  return (
    <li className="flex items-center" {...props}>
      <div className="flex justify-between w-full h-6">
        <div className="flex justify-start w-full">
          <img className="w-6 h-6 mr-3" src={icon} alt={option.region} />
          <Typography color={getClassNameColor(option.class)}>{fullNick}</Typography>
        </div>

        <RegionIcon className="self-center" />
      </div>
    </li>
  );
};

const PlayersSearch = () => {
  let navigate = useNavigate();
  let delay = 5;
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<ISearchResults[]>([]);
  useDebounce(
    async () => {
      if (inputValue === '') {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      const data = (await searchPlayers(inputValue)) as ISearchResults[];
      const players = uniqBy(data, 'nick');
      setSearchResults(players);
      setLoading(false);
    },
    delay,
    [inputValue]
  );

  const redirectToProfile = (option: string | ISearchResults) => {
    if (typeof option === 'string') return;
    const nicknameSplit = option.nick.split(/-(.*)/s);
    const realm = capitalizeFirstLetter(nicknameSplit[1]);
    const name = capitalizeFirstLetter(nicknameSplit[0]);
    navigate(`/${option.region}/${realm}/${name}`);
  };

  const first = (count: number, searchResults: ISearchResults[]) => {
    return searchResults.slice(0, count);
  }

  return (
    <Autocomplete
      ListboxProps={{ style: { maxHeight: 1000, overflow: 'auto' } }}
      className="inline-flex my-2 w-full"
      disablePortal
      freeSolo
      loading={loading}
      filterOptions={(x) => first(15, x) }
      options={searchResults}
      getOptionLabel={(option) => {
        return capitalizeNickname(typeof option === 'string' ? option : option.nick);
      }}
      renderOption={renderSearchOption}
      onChange={(event, newValue) => {
        redirectToProfile(newValue);
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      disableClearable
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            label="Search for characters..."
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        );
      }}
    />
  );
};
export default PlayersSearch;
