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

export const getActivityFromUrl = () => {
  let activity;
  let splitx = window.location.pathname.split("/");
  if(splitx.length >= 4){
    activity = splitx[2];
  } else {
    activity = "activity";
  }
  return activity;
}