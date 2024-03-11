import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isEmpty } from 'lodash';

import { Button } from '@mui/material';
import Spec from './Spec';
import CutOffRating from './CutOffRating';

import { CRESTS_AND_SPECS } from '@/constants/filterSchema';

interface IProps {
  selectedSpecs: string[];
  onSpecsChange: (specs: string[]) => void;
  bracket: string;
  statistics: any;
}

const TableFilter = ({ selectedSpecs, onSpecsChange, bracket, statistics: statistic }: IProps) => {
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
    <div className="bg-[#030303e6] px-4 sm:px-8">
      <div className="flex items-center justify-between pt-2 sm:pt-6 pb-0">
        <CutOffRating statistic={statistic} bracket={bracket} />
        <Button className="!px-8 !text-white !bg-[#1F2937]" onClick={toggleFilterShown}>
          Filters
          {!isEmpty(selectedSpecs) && (
            <div className="flex justify-center items-center absolute w-6 h-6 -top-2 -right-2 bg-[#1769aa] text-[#fff] rounded-full text-xs">
              {selectedSpecs.length}
            </div>
          )}
        </Button>
      </div>

      <div className={filtersShown ? 'visible rounded p-4 mt-4 bg-[#1f2937] bg-opacity-25' : 'invisible h-0 min-h-0 overflow-hidden'}>
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

        <div className="flex justify-end pt-4">
          <Button
            className="!px-8 !bg-[#991b1b] !bg-opacity-50 !text-white"
            disabled={isEmpty(selectedSpecs)}
            onClick={resetFilters}
          >
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TableFilter;
