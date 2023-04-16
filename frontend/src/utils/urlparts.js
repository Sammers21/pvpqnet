import {BRACKETS} from '../constants/pvp-activity';
import {REGIONS} from '../constants/region';

export const getBracket = (bracket) => {
  const validBracket = Object.values(BRACKETS).find((r) => bracket === r);
  return validBracket ?? BRACKETS.shuffle;
};

export const getRegion = (region) => {
  const validRegion = Object.values(REGIONS).find((r) => region === r);
  return validRegion ?? REGIONS.eu;
};

export const getActivity = (activity) => {
  const validActivity = Object.values(["activity", "ladder"]).find((r) => activity === r);
  return validActivity ?? "activity";
};