import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isEmpty } from 'lodash';

import { Button } from '@mui/material';
import { CRESTS_AND_SPECS } from '../../constants/filterSchema';

import Spec from './Spec';

interface IProps {
  selectedSpecs: string[];
  onSpecsChange: (specs: string[]) => void;
}

const TableFilter = ({ selectedSpecs, onSpecsChange }: IProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filtersShown, setFiltersShown] = useState(selectedSpecs.length > 0);

  const toggleFilterShown = () => {
    setFiltersShown(!filtersShown);
  };

  const resetFilters = () => {
    navigate(location.pathname);
    onSpecsChange([]);
  };

  const handleSpecsSelect = (newSpecs: string[]) => {
    if (newSpecs.length === 0) {
      resetFilters();
    } else {
      navigate(location.pathname + '?specs=' + newSpecs.join(','));
      onSpecsChange(newSpecs);
    }
  };

  return (
    <div className="bg-[#030303e6] px-8">
      <div className="flex justify-end pt-8 pb-0">
        <Button className="!px-8 !bg-[#1F2937]" onClick={toggleFilterShown}>
          Filters
          {!isEmpty(selectedSpecs) && (
            <div className="flex justify-center items-center absolute w-6 h-6 -top-2 -right-2 bg-[#1769aa] text-[#fff] rounded-full text-xs">
              {selectedSpecs.length}
            </div>
          )}
        </Button>
      </div>

      {filtersShown && (
        <div className="pt-4">
          <div className="flex flex-wrap justify-center gap-8">
            {Object.entries(CRESTS_AND_SPECS).map(([crestId, specs]) => {
              return (
                <Spec
                  crestId={crestId}
                  specs={specs}
                  handleSpecsSelect={handleSpecsSelect}
                  selectedSpecs={selectedSpecs}
                />
              );
            })}
          </div>

          <div className="flex justify-end py-4">
            <Button
              className="!px-8 !bg-[#1f2937]"
              disabled={isEmpty(selectedSpecs)}
              onClick={resetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilter;
