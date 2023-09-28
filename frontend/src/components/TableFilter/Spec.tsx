import { useMemo } from 'react';
import { difference } from 'lodash';

interface IProps {
  crestId: string;
  specs: string[];
  selectedSpecs: string[];
  handleSpecsSelect: (specs: string[]) => void;
}

const Spec = ({ crestId, specs, selectedSpecs, handleSpecsSelect }: IProps) => {
  const isCrestSelected = useMemo(
    () => difference(specs, selectedSpecs).length === 0,
    [specs, selectedSpecs]
  );

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
        src={require(`../../assets/crests/${crestId}.png`)}
        onClick={onCrestSelect}
        alt="crestId"
      />

      <div className="flex justify-center">
        {specs.map((spec: string) => {
          const styles = selectedSpecs.includes(spec)
            ? 'grayscale-0 opacity-100'
            : 'grayscale opacity-50';

          return (
            <img
              src={require(`../../assets/specicons/${spec}.png`)}
              className={`${styles} h-8 w-8 mx-1 cursor-pointer`}
              onClick={() => onSpecSelect(spec)}
              alt="spec"
            />
          );
        })}
      </div>
    </div>
  );
};

export default Spec;
