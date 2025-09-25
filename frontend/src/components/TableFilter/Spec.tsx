import { useMemo } from "react";
import { difference } from "lodash";
import { cn } from "@/utils/classnames";
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
  const crestStyles = isCrestSelected
    ? "grayscale-0 opacity-100 scale-105 shadow-lg shadow-blue-500/25"
    : "grayscale opacity-60 hover:opacity-80 hover:scale-105 transition-all duration-200";
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
    <div className="flex flex-col items-center justify-center p-3 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30 hover:border-gray-600/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="relative group">
        <img
          className={cn(
            crestStyles,
            "w-20 h-20 sm:w-24 sm:h-24 cursor-pointer rounded-lg transition-all duration-200"
          )}
          src={require(`../../assets/crests/${crestId}.png`)}
          onClick={onCrestSelect}
          loading="lazy"
          alt={crestId ?? "Crest Icon"}
        />
        {isCrestSelected && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      <div className="flex justify-center mt-3 space-x-1">
        {specs.map((spec: string) => {
          const isSelected = selectedSpecs.includes(spec);
          const styles = isSelected
            ? "grayscale-0 opacity-100 scale-110 shadow-md shadow-blue-500/25"
            : "grayscale opacity-60 hover:opacity-80 hover:scale-105 transition-all duration-200";
          return (
            <div key={spec} className="relative group">
              <img
                src={require(`../../assets/specicons/${spec}.png`)}
                className={cn(
                  styles,
                  "h-6 w-6 sm:h-8 sm:w-8 cursor-pointer rounded transition-all duration-200"
                )}
                onClick={() => onSpecSelect(spec)}
                alt={spec ?? "Spec Icon"}
              />
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Spec;
