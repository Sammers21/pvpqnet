import { FRACTION, WOW_CLASS, WOW_CLASS_ICON, WOW_RACE, WOW_SPEC } from '../constants/table';
import type { IActivityRecord, IPlayer, IPlayerBracket } from '../types';

export const getProfileUrl = (record: IActivityRecord, region: string) => {
  const name = record?.character?.name || record?.name;
  const realm = record?.character?.realm || record?.realm;
  return window.location.origin + `/${region}/${realm}/${name}`;
};

export const getFractionIcon = (fraction: string) => {
  return fraction.toUpperCase() === FRACTION.ALLIANCE
    ? require(`../assets/fraction/alliance.png`)
    : require('../assets/fraction/horde.png');
};

export const getRealmColor = (fraction?: string) => {
  if (!fraction) return '#FFFFFF';
  return fraction.toUpperCase() === FRACTION.ALLIANCE ? '#3FC7EB' : '#ff0000';
};

export const specNameFromFullSpec = (spec: string) => {
  return spec.trim().replaceAll(' ', '').toLowerCase();
};

export const getClassNameColor = (wowClass?: string) => {
  if (!wowClass) return '#FFFFFF';
  wowClass = wowClass.toUpperCase();

  if (wowClass.includes(WOW_CLASS.WARRIOR)) {
    return '#C69B6D';
  } else if (wowClass.includes(WOW_CLASS['DEMON HUNTER'])) {
    return '#A330C9';
  } else if (wowClass.includes(WOW_CLASS.PALADIN)) {
    return '#F48CBA';
  } else if (wowClass.includes(WOW_CLASS.HUNTER)) {
    return '#8EBA43';
  } else if (wowClass.includes(WOW_CLASS.ROGUE)) {
    return '#FFF468';
  } else if (wowClass.includes(WOW_CLASS.PRIEST)) {
    return '#FFFFFF';
  } else if (wowClass.includes(WOW_CLASS['DEATH KNIGHT'])) {
    return '#C41E3A';
  } else if (wowClass.includes(WOW_CLASS.SHAMAN)) {
    return '#0070DD';
  } else if (wowClass.includes(WOW_CLASS.MAGE)) {
    return '#3FC7EB';
  } else if (wowClass.includes(WOW_CLASS.WARLOCK)) {
    return '#8788EE';
  } else if (wowClass.includes(WOW_CLASS.MONK)) {
    return '#00FF98';
  } else if (wowClass.includes(WOW_CLASS.DRUID)) {
    return '#FF7C0A';
  } else if (wowClass.includes(WOW_CLASS.EVOKER)) {
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
  return diff >= 0 ? `+${diff}` : `${diff}`;
};

export const getClassIcon = (wowClass: string) => {
  const className = specNameFromFullSpec(wowClass).toUpperCase() as WOW_CLASS_ICON;

  return Object.values(WOW_CLASS_ICON).includes(className)
    ? require(`../assets/classicons/${specNameFromFullSpec(wowClass)}.png`)
    : require('../assets/unknown.png');
};

export const getSpecIcon = (wowSpec: string) => {
  const specName = specNameFromFullSpec(wowSpec) as WOW_SPEC;

  return Object.values(WOW_SPEC).includes(specName)
    ? require(`../assets/specicons/${specNameFromFullSpec(wowSpec)}.png`)
    : require('../assets/unknown.png');
};

const getRaceIcon = (wowGender: string, wowRace: string) => {
  const raceName = `${wowGender.toLowerCase().charAt(0)}${wowRace
    .replaceAll(' ', '')
    .replaceAll("'", '')
    .toLowerCase()}` as WOW_RACE;

  return Object.values(WOW_RACE).includes(raceName)
    ? require(`../assets/raceicons/${raceName}.webp`)
    : require('../assets/unknown.png');
};

export const getDetaisImages = ({
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
  const classIcon = getClassIcon(wowClass);
  const specIcon = getSpecIcon(wowSpec);
  const raceIcon = getRaceIcon(wowGender, wowRace);

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

export const ratingToColor = (bracket: Partial<IPlayerBracket>) => {
  const { rating = 0, is_rank_one_range = false } = bracket;

  if (is_rank_one_range) return '#fb7e00';
  else if (rating >= 2100) {
    return '#a335ee';
  } else if (rating >= 1800) {
    return '#0d47a1';
  } else if (rating >= 1500) {
    return '#1976d2';
  } else if (rating >= 1200) {
    return '#4caf50';
  } else if (rating >= 900) {
    return '#d2d2d2';
  }
  return '#ffffff';
};

const getRankImageName = (rank: string): string => {
  if (rank === 'r1_3s') {
    return 'rank_10.png';
  } else if (rank === 'r1_shuffle') {
    return 'rank_10.png';
  } else if (rank === 'Gladiator') {
    return 'rank_9.png';
  } else if (rank === 'Legend') {
    return 'rank_legend.png';
  } else if (rank === 'Elite') {
    return 'rank_8.png';
  } else if (rank === 'Duelist') {
    return 'rank_7.png';
  } else if (rank === 'Rival') {
    return 'rank_6.png';
  } else if (rank === 'Challenger') {
    return 'rank_4.png';
  } else if (rank === 'Combatant') {
    return 'rank_2.png';
  } else {
    return 'rank_2.png';
  }
};

export const getSeasonRankImage = (rank: string) => {
  return require('../assets/ranks/' + getRankImageName(rank));
};

export const getAltProfileUrl = (alt: IPlayer) => {
  return window.location.origin + `/${alt.region}/${alt.realm}/${alt.name}`;
};

export const getTitleDescription = (title: string) => {
  if (title === 'Gladiator') {
    return 'Win 50 games with more than 2400 arena rating during the PvP Season.';
  }
  if (title.includes('Gladiator')) {
    return 'End PvP Season in the top 0.1% of the 3v3 arena ladder.';
  }
  if (title.includes('Legend')) {
    return 'Win 100 Rated Solo Shuffle rounds while at Elite rank during the Pvp Season.';
  }
  if (title.includes('Elite')) {
    return 'Earn 2400 rating during the PvP Season.';
  }
  if (title.includes('Duelist')) {
    return 'Earn between 2100 and 2399 rating during the PvP Season.';
  }
  if (title.includes('Rival')) {
    return 'Earn between 1800 and 2099 rating during the PvP Season.';
  }
  if (title.includes('Challenger')) {
    return 'Earn between 1600 and 1799 rating during the PvP season.';
  }
};
