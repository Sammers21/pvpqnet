import { FRACTION, WOW_CLASS, WOW_CLASS_ICON, WOW_RACE, WOW_SPEC } from '../constants/table';
import type { CharacterAndDiff, Player, Bracket } from '../types';

export const winGreen = '#32CD32';
export const lossRed = '#ff0000';

export const hordeRed = '#d23636';
export const allianceBlue = '#4accff';

export const getProfileUrl = (record: CharacterAndDiff, region: string) => {
  const name = record?.character?.name || record?.name;
  const realm = record?.character?.realm || record?.realm;
  return `${window.location.origin}/${region}/${realm}/${name}`;
};

export const getFractionIcon = (fraction: string) => {
  const path = fraction.toUpperCase() === FRACTION.ALLIANCE 
    ? '/src/assets/fraction/alliance.png' 
    : '/src/assets/fraction/horde.png';
  return new URL(path, import.meta.url).href;
};

export const getRealmColor = (fraction?: string) => {
  if (!fraction) return '#FFFFFF';
  return fraction.toUpperCase() === FRACTION.ALLIANCE ? allianceBlue : hordeRed;
};

export const specNameFromFullSpec = (spec: string) => spec.trim().replaceAll(' ', '').toLowerCase();

export const getClassNameColor = (wowClass?: string) => {
  if (!wowClass) return '#FFFFFF';
  wowClass = wowClass.toUpperCase();

  switch (true) {
    case wowClass.includes(WOW_CLASS.WARRIOR): return '#C69B6D';
    case wowClass.includes(WOW_CLASS['DEMON HUNTER']): return '#A330C9';
    case wowClass.includes(WOW_CLASS.PALADIN): return '#F48CBA';
    case wowClass.includes(WOW_CLASS.HUNTER): return '#8EBA43';
    case wowClass.includes(WOW_CLASS.ROGUE): return '#FFF468';
    case wowClass.includes(WOW_CLASS.PRIEST): return '#FFFFFF';
    case wowClass.includes(WOW_CLASS['DEATH KNIGHT']): return '#C41E3A';
    case wowClass.includes(WOW_CLASS.SHAMAN): return '#0070DD';
    case wowClass.includes(WOW_CLASS.MAGE): return '#3FC7EB';
    case wowClass.includes(WOW_CLASS.WARLOCK): return '#8788EE';
    case wowClass.includes(WOW_CLASS.MONK): return '#00FF98';
    case wowClass.includes(WOW_CLASS.DRUID): return '#FF7C0A';
    case wowClass.includes(WOW_CLASS.EVOKER): return '#33937F';
    default: return '#FFFFFF';
  }
};

export const getDiffColor = (diff: number): string => diff === 0 ? 'white' : diff > 0 ? winGreen : lossRed;
export const getRankDiffColor = (diff: number): string => (diff === 0 || diff === undefined) ? 'white' : diff < 0 ? winGreen : lossRed;
export const getDiffCell = (diff: number): string | number => diff >= 0 ? `+${diff}` : `${diff}`;

export const getClassIcon = (wowClass: string) => {
  const className = specNameFromFullSpec(wowClass).toUpperCase() as WOW_CLASS_ICON;
  const path = Object.values(WOW_CLASS_ICON).includes(className)
    ? `/src/assets/classicons/${specNameFromFullSpec(wowClass)}.png`
    : '/src/assets/unknown.png';
  return new URL(path, import.meta.url).href;
};

export const getSpecIcon = (wowSpec: string) => {
  const specName = specNameFromFullSpec(wowSpec) as WOW_SPEC;
  const path = Object.values(WOW_SPEC).includes(specName)
    ? `/src/assets/specicons/${specNameFromFullSpec(wowSpec)}.png`
    : '/src/assets/unknown.png';
  return new URL(path, import.meta.url).href;
};

const getRaceIcon = (wowGender: string, wowRace: string) => {
  const raceName = `${wowGender.toLowerCase().charAt(0)}${wowRace.replaceAll(' ', '').replaceAll("'", '').toLowerCase()}` as WOW_RACE;
  const path = Object.values(WOW_RACE).includes(raceName)
    ? `/src/assets/raceicons/${raceName}.webp`
    : '/src/assets/unknown.png';
  return new URL(path, import.meta.url).href;
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
}) => ({
  classIcon: getClassIcon(wowClass),
  specIcon: getSpecIcon(wowSpec),
  raceIcon: getRaceIcon(wowGender, wowRace),
});

export const getWinRate = (wins: number, losses: number) => wins && ((wins * 100) / (wins + losses)).toFixed(2) + `%`;

export const getWonAndLossColors = (won: number, loss: number) => ({
  wonColor: won > 0 ? winGreen : '#FFFFFF',
  lossColor: loss > 0 ? lossRed : '#FFFFFF',
});

export const getRatingColor = (in_cutoff: boolean) => in_cutoff ? '#fb7e00' : '#FFFFFF';

export const ratingToColor = (rating: number, is_rank_one_range = false) => {
  if (is_rank_one_range) return '#fb7e00';
  if (rating >= 2400) return '#a335ee';
  if (rating >= 2100) return '#2b8cb9';
  return '#FFFFFF';
};

export const bracketToColor = (bracket: Partial<Bracket>) => {
  const { rating = 0, is_rank_one_range = false } = bracket;
  return ratingToColor(rating, is_rank_one_range);
};

export const getRankImageName = (rank: string) => {
  switch (rank) {
    case 'r1_3s':
    case 'r1_shuffle': return 'rank_10.png';
    case 'Gladiator': return 'rank_9.png';
    case 'Legend': return 'rank_legend.png';
    case 'Elite': return 'rank_8.png';
    case 'Duelist': return 'rank_7.png';
    case 'Rival': return 'rank_6.png';
    case 'Challenger': return 'rank_4.png';
    case 'Combatant': return 'rank_2.png';
    case 'Unranked':
    default: return 'unranked.png';
  }
};

export const getSeasonRankImage = (rank: string) => new URL(`/src/assets/ranks/${getRankImageName(rank)}`, import.meta.url).href;

export const getSeasonRankImageFromRating = (rating: number, is_rank_one_range: boolean) => {
  if (is_rank_one_range) return getSeasonRankImage('r1_3s');
  if (rating >= 2400) return getSeasonRankImage('Gladiator');
  if (rating >= 2100) return getSeasonRankImage('Duelist');
  if (rating >= 1800) return getSeasonRankImage('Rival');
  if (rating >= 1400) return getSeasonRankImage('Challenger');
  if (rating >= 1000) return getSeasonRankImage('Combatant');
  return getSeasonRankImage('Unranked');
};

export const getAltProfileUrl = (alt: Player) => `${window.location.origin}/${alt.region}/${alt.realm}/${alt.name}`;
