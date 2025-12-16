import { useMemo } from "react";
import { difference } from "lodash";
import { cn } from "@/utils/classnames";
import { getClassIcon, getSpecIcon } from "@/utils/table";

interface IProps {
  crestId: string;
  specs: string[];
  selectedSpecs: string[];
  handleSpecsSelect: (specs: string[]) => void;
}

const CLASS_ICON_BY_CREST: Record<string, string> = {
  1: "warrior",
  2: "paladin",
  3: "hunter",
  4: "rogue",
  5: "priest",
  6: "deathknight",
  7: "shaman",
  8: "mage",
  9: "warlock",
  10: "monk",
  11: "druid",
  12: "demonhunter",
  13: "evoker",
};

const Spec = ({ crestId, specs, selectedSpecs, handleSpecsSelect }: IProps) => {
  const isCrestSelected = useMemo(
    () => difference(specs, selectedSpecs).length === 0,
    [specs, selectedSpecs]
  );

  const classIcon = CLASS_ICON_BY_CREST[crestId];
  const classIconSrc = getClassIcon(classIcon ?? "");

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
    <div className="flex flex-col items-center gap-2 rounded-lg p-2 transition-colors hover:bg-slate-800/40">
      <div className="relative group">
        <img
          className={cn(
            "h-10 w-10 cursor-pointer rounded-xl bg-slate-900/80 p-1.5 transition-all duration-300 hover:scale-105 sm:h-12 sm:w-12",
            isCrestSelected
              ? "grayscale-0 opacity-100 ring-1 ring-sky-500/50 shadow-[0_0_15px_-3px_rgba(14,165,233,0.3)]"
              : "grayscale opacity-40 hover:opacity-80"
          )}
          src={classIconSrc}
          onClick={onCrestSelect}
          loading="lazy"
          alt={classIcon ?? "Class Icon"}
        />
        <div
          className={cn(
            "absolute -bottom-1 left-1/2 h-0.5 w-1/2 -translate-x-1/2 rounded-full bg-sky-500 transition-all duration-300",
            isCrestSelected ? "opacity-100 w-3/4" : "opacity-0 w-0"
          )}
        ></div>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 max-w-[80px] sm:max-w-none">
        {specs.map((spec: string) => {
          const isSelected = selectedSpecs.includes(spec);

          return (
            <div key={spec} className="relative group/spec">
              <img
                src={getSpecIcon(spec)}
                className={cn(
                  "h-7 w-7 rounded-full cursor-pointer transition-all duration-200 border border-transparent",
                  isSelected
                    ? "grayscale-0 opacity-100 scale-110 border-sky-500/50"
                    : "grayscale opacity-40 hover:opacity-100 hover:scale-110 hover:border-sky-500/30"
                )}
                onClick={() => onSpecSelect(spec)}
                alt={spec ?? "Spec Icon"}
              />
              {isSelected && (
                <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sky-400 shadow-[0_0_5px_rgba(56,189,248,0.8)]"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Spec;
