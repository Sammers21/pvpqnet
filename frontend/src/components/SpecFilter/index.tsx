import { useState } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { CRESTS_AND_SPECS } from '../../constants/filterSchema';
import { useNavigate } from 'react-router-dom';

interface IProps {
  specs: any;
  onSpecsChange: Function;
}

const SpecFilter = ({ specs, onSpecsChange }: IProps) => {
  const navigate = useNavigate();
  const [filtersShown, setFiltersShown] = useState(specs.length > 0);

  const toggleFilters = () => {
    setFiltersShown(!filtersShown);
  };

  const resetFilters = () => {
    navigate(window.location.pathname);
    onSpecsChange([]);
  };

  const speckClicked = (spec: any) => {
    var resspecs = [];
    if (specs.includes(spec)) {
      resspecs = specs.filter((s: any) => s !== spec);
    } else {
      specs.push(spec);
      resspecs = specs;
    }
    if (resspecs.length === 0) {
      navigate(window.location.pathname);
      onSpecsChange([]);
    } else {
      navigate(window.location.pathname + '?specs=' + resspecs.join(','));
      onSpecsChange(resspecs);
    }
  };
  const crests = Object.keys(CRESTS_AND_SPECS).map((crest) => {
    const internalSpecs = (CRESTS_AND_SPECS as any)[crest as any];

    const specImgs = internalSpecs.map((spec: any) => {
      const grayScale = specs.includes(spec) ? 'grayscale(0%)' : 'grayscale(100%)';
      const opacity = specs.includes(spec) ? 1 : 0.5;
      return (
        <img
          src={new URL('../../assets/specicons/' + spec + '.png', import.meta.url).href}
          style={{ width: '2rem', height: '2rem', filter: grayScale, opacity: opacity }}
          onClick={() => speckClicked(spec)}
        />
      );
    });
    return (
      <Box>
        <img
          src={new URL('../../assets/crests/' + crest + '.png', import.meta.url).href}
          style={{ width: '7rem', height: '7rem', filter: 'grayscale(100%)', opacity: 0.5 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>{specImgs}</Box>
      </Box>
    );
  });
  const render = () => {
    return (
      <Grid>
        <Grid
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '16px',
            marginTop: '16px',
          }}
        >
          <Button
            style={{
              backgroundColor: '#1f2937',
              paddingRight: '2rem',
              paddingLeft: '2rem',
            }}
            onClick={toggleFilters}
          >
            Filters
          </Button>
        </Grid>
        {filtersShown && (
          <Grid>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '2rem',
              }}
            >
              {crests}
            </Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginBottom: '16px',
                marginTop: '16px',
              }}
            >
              <Button
                style={{
                  backgroundColor: '#1f2937',
                  paddingRight: '2rem',
                  paddingLeft: '2rem',
                }}
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    );
  };
  return render();
};

export default SpecFilter;
