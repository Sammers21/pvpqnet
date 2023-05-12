import { FRACTION, WOW_CLASS, WOW_RACE, WOW_SPEC } from '../constants';
import { getImageSrc } from './common/getImageSrc';

export const getRealmColor = (fraction: string) => {
  return fraction === FRACTION.ALLIANCE ? '#3FC7EB' : '#ff0000';
};

export const specNameFromFullSpec = (spec: string) => {
  return spec.trim().replaceAll(' ', '').toLowerCase();
};

export const getClassNameColor = (wowClass: string) => {
  wowClass = wowClass.toUpperCase();

  if (wowClass === WOW_CLASS.WARRIOR) {
    return '#C69B6D';
  } else if (wowClass === WOW_CLASS.PALADIN) {
    return '#F48CBA';
  } else if (wowClass === WOW_CLASS.HUNTER) {
    return '#8EBA43';
  } else if (wowClass === WOW_CLASS.ROGUE) {
    return '#FFF468';
  } else if (wowClass === WOW_CLASS.PRIEST) {
    return '#FFFFFF';
  } else if (wowClass === WOW_CLASS['DEATH KNIGHT']) {
    return '#C41E3A';
  } else if (wowClass === WOW_CLASS.SHAMAN) {
    return '#0070DD';
  } else if (wowClass === WOW_CLASS.MAGE) {
    return '#3FC7EB';
  } else if (wowClass === WOW_CLASS.WARLOCK) {
    return '#8788EE';
  } else if (wowClass === WOW_CLASS.MONK) {
    return '#00FF98';
  } else if (wowClass === WOW_CLASS.DRUID) {
    return '#FF7C0A';
  } else if (wowClass === WOW_CLASS['DEMON HUNTER']) {
    return '#A330C9';
  } else if (wowClass === WOW_CLASS.EVOKER) {
    return '#33937F';
  } else {
    return '#FFFFFF';
  }
};

export const getDiffColor = (diff: number): string => {
  if (diff === 0) return 'white';
  return diff > 0 ? 'green' : '#ff0000';
};

export const getRankDiffColor = (diff: number): string => {
  if (diff === 0) return 'white';
  return diff < 0 ? 'green' : '#ff0000';
};

export const getDiffCell = (diff: number): string | number => {
  return diff >= 0 ? `+${diff}` : diff;
};

const geClassIconPath = (wowClass: string) => {
  const className = specNameFromFullSpec(wowClass).toUpperCase() as WOW_CLASS;

  return Object.values(WOW_CLASS).includes(className)
    ? `../../assets/classicons/${specNameFromFullSpec(wowClass)}.png`
    : '../../assets/unknown.png';
};

const getSpecIconPath = (wowSpec: string) => {
  const specName = specNameFromFullSpec(wowSpec) as WOW_SPEC;

  return Object.values(WOW_SPEC).includes(specName)
    ? `../../assets/specicons/${specNameFromFullSpec(wowSpec)}.png`
    : '../../assets/unknown.png';
};

const getRaceIconPath = (wowGender: string, wowRace: string) => {
  const raceName = `${wowGender.toLowerCase().charAt(0)}${wowRace
    .replaceAll(' ', '')
    .replaceAll("'", '')
    .toLowerCase()}` as WOW_RACE;

  return Object.values(WOW_RACE).includes(raceName)
    ? `../../assets/raceicons/${raceName}.webp`
    : '../../assets/unknown.png';
};

export const getImages = ({
  wowClass,
  wowSpec,
  wowRace,
  wowGender,
}: {
  wowClass: string;
  wowSpec: string;
  wowRace: string;
  wowGender: string;
}): { classIcon: string; specIcon: string; raceIcon: string } => {
  const classIcon = getImageSrc(geClassIconPath(wowClass));
  const specIcon = getImageSrc(getSpecIconPath(wowSpec));
  const raceIcon = getImageSrc(getRaceIconPath(wowGender, wowRace));

  return { classIcon, specIcon, raceIcon };
};

export const getWinRate = (wins: number, losses: number) => {
  return wins && ((wins * 100) / (wins + losses)).toFixed(2) + `%`;
};

export const getWonAndLossColors = (
  won: number,
  loss: number
): { wonColor: string; lossColor: string } => {
  return { wonColor: won > 0 ? '#008000' : '#FFFFFF', lossColor: loss > 0 ? '#ff0000' : '#FFFFFF' };
};

export const getRatingColor = (in_cutoff: boolean) => {
  return in_cutoff ? '#fb7e00' : '#FFFFFF';
};
