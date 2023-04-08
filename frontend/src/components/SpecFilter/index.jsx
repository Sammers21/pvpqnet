import React, {useState} from 'react';
import {Box, Button, Grid} from "@mui/material";
import {CRESTS_AND_SPECS} from "../../constants/filterSchema";

const SpecFilter = ({specs}) => {

  const [filtersShown, setFiltersShown] = useState(specs.length > 0);
  const toggleFilters = () => setFiltersShown(!filtersShown)
  const resetFilters = () => {}
  const crests = Object.keys(CRESTS_AND_SPECS).map((crest) => {
    const internalSpecs = CRESTS_AND_SPECS[crest];
    const specImgs = internalSpecs.map((spec) => {
      return <img src={require("../../assets/specicons/" + spec + ".png")}
                  style={{width: '2rem', height: '2rem', filter: 'grayscale(100%)', opacity: .5}}/>
    });
    return (<Box>
      <img src={require("../../assets/crests/" + crest + ".png")}
           style={{width: '7rem', height: '7rem', filter: 'grayscale(100%)', opacity: .5}}/>
      <Box sx={{display: 'flex', justifyContent: 'center'}}>
        {specImgs}
      </Box>
    </Box>);
  });
  const render = () => {
    return <Grid>
      <Grid sx={{display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', marginTop: '16px'}}>
        <Button style={{
          backgroundColor: "#1f2937",
          paddingRight: "2rem",
          paddingLeft: "2rem"
        }} onClick={toggleFilters}>Filters</Button>
      </Grid>
      {filtersShown &&
        <Grid>
          <Box sx={{display: 'flex', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem'}}>
            {crests}
          </Box>
          <Box  sx={{display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', marginTop: '16px'}}>
            <Button style={{
              backgroundColor: "#1f2937",
              paddingRight: "2rem",
              paddingLeft: "2rem"
            }} onClick={resetFilters}>Reset Filters</Button>
          </Box>
        </Grid>
      }
    </Grid>;
  };
  return render();
};

export default SpecFilter;
