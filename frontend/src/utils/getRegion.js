import { REGIONS } from '../constants/region';

export const getRegion = (region) => {
  const validRegion = Object.values(REGIONS).find((r) => region === r);

  return validRegion ?? REGIONS.eu;
};
