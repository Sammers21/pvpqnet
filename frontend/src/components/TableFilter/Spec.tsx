import difference from 'lodash/difference';

import { getImageSrc } from '../../utils/common/getImageSrc';
import { isExistsInAnotherArray } from '../../utils/common/isExistsInAnotherArray';

interface IProps {
  crestId: number;
  specs: string[];
  selectedSpecs: string[];
  handleSpecsSelect: (specs: string[]) => void;
}

const Spec = ({ crestId, specs, selectedSpecs, handleSpecsSelect }: IProps) => {
  const isCrestSelected = isExistsInAnotherArray(specs, selectedSpecs);
  const crestStyles = isCrestSelected ? 'grayscale-0 opacity-100' : 'grayscale opacity-50';

  const onCrestSelect = () => {
    const newSpecs = isCrestSelected
      ? difference(selectedSpecs, specs)
      : [...new Set([...selectedSpecs, ...specs])];

    handleSpecsSelect(newSpecs);
  };

  const onSpecSelect = (spec: string) => {
    const newSpecs = selectedSpecs.includes(spec)
      ? selectedSpecs.filter((s) => s !== spec)
      : [...selectedSpecs, spec];

    handleSpecsSelect(newSpecs);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <img
        className={`${crestStyles} w-28 h-28 cursor-pointer`}
        src={getImageSrc(`../../assets/crests/${crestId}.png`)}
        onClick={onCrestSelect}
      />

      <div className="flex justify-center">
        {specs.map((spec: string) => {
          const styles = selectedSpecs.includes(spec)
            ? 'grayscale-0 opacity-100'
            : 'grayscale opacity-50';

          return (
            <img
              src={getImageSrc(`../../assets/specicons/${spec}.png`)}
              className={`${styles} h-8 w-8 mx-1 cursor-pointer`}
              onClick={() => onSpecSelect(spec)}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Spec;
