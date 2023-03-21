import { DISCIPLINES } from '../constants/pvp-activity';

export const getDiscipline = (discipline) => {
  const validDiscipline = Object.values(DISCIPLINES).find((r) => discipline === r);

  return validDiscipline ?? DISCIPLINES.shuffle;
};
