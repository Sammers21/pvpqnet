import {DISCIPLINES} from '../constants/pvp-activity';
import {REGIONS} from '../constants/region';

export const getDiscipline = (discipline) => {
  const validDiscipline = Object.values(DISCIPLINES).find((r) => discipline === r);
  return validDiscipline ?? DISCIPLINES.shuffle;
};

export const getRegion = (region) => {
  const validRegion = Object.values(REGIONS).find((r) => region === r);
  return validRegion ?? REGIONS.eu;
};

export const getActivity = (activity) => {
  const validActivity = Object.values(["activity", "ladder"]).find((r) => activity === r);
  return validActivity ?? "activity";
};