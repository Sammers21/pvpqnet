import React, {useState} from 'react';
import {Button, Grid} from "@mui/material";
import {CRESTS_AND_SPECS} from "../../constants/filterSchema";

const SpecFilter = ({specs}) => {

  const [filtersShown, setFiltersShown] = useState(specs.length > 0);
  const crests = Object.keys(CRESTS_AND_SPECS).map((crest) => {
    const crestImg = "../../assets/crests/" + crest + ".png";
    return <div className="crest">
      <img src={crestImg} alt={crest} style={{width: '32px', height: '32px'}}/>
    </div>
  });
  const render = () => {
    return <Grid sx={{display: 'flex', justifyContent: 'flex-end', marginBottom: '16px', marginTop: '16px'}}>
      {/*{crests}*/}
      <Button style={{
        backgroundColor: "#1f2937",
        paddingRight: "2rem",
        paddingLeft: "2rem"
      }}>Filters</Button>
    </Grid>
  };
  return render();
};

export default SpecFilter;
