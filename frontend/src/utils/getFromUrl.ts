import { ACTIVITY, BRACKET, REGION } from '../constants';

export const getBracket = (bracket: unknown): BRACKET => {
  const validBracket = Object.values(BRACKET).find((r) => bracket === r);
  return validBracket ?? BRACKET.shuffle;
};

export const getRegion = (region: unknown): REGION => {
  const validRegion = Object.values(REGION).find((r) => region === r);
  return validRegion ?? REGION.eu;
};

export const getActivity = (activity: unknown): ACTIVITY => {
  const validActivity = Object.values(ACTIVITY).find((r) => activity === r);
  return validActivity ?? ACTIVITY.activity;
};
