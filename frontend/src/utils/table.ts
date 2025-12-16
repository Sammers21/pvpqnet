import { FRACTION, WOW_CLASS, WOW_CLASS_ICON, WOW_RACE, WOW_SPEC } from '../constants/table';
import type { CharacterAndDiff, Player, Bracket } from '../types';
import unknownIcon from '../assets/unknown.png';
import allianceIcon from '../assets/fraction/alliance.png';
import hordeIcon from '../assets/fraction/horde.png';

export const winGreen = '#32CD32';
export const lossRed = '#ff0000';

export const hordeRed = '#d23636';
export const allianceBlue = '#4accff';

const classIcons = import.meta.glob('../assets/classicons/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const specIcons = import.meta.glob('../assets/specicons/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const raceIconsWebp = import.meta.glob('../assets/raceicons/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const raceIconsPng = import.meta.glob('../assets/raceicons/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const raceIconsJpg = import.meta.glob('../assets/raceicons/*.jpg', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const rankIcons = import.meta.glob('../assets/ranks/*.{png,webp,jpg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export const getProfileUrl = (record: CharacterAndDiff, region: string) => {
  const name = record?.character?.name || record?.name;
  const realm = record?.character?.realm || record?.realm;
  return window.location.origin + `/${region}/${realm}/${name}`;
};

export const getFractionIcon = (fraction: string) => {
  return fraction.toUpperCase() === FRACTION.ALLIANCE ? allianceIcon : hordeIcon;
};

export const getRealmColor = (fraction?: string) => {
  if (!fraction) return '#FFFFFF';
  return fraction.toUpperCase() === FRACTION.ALLIANCE ? allianceBlue : hordeRed;
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
  return diff > 0 ? winGreen : lossRed;
};

export const getRankDiffColor = (diff: number): string => {
  if (diff === 0 || diff === undefined) return 'white';
  return diff < 0 ? winGreen : lossRed;
};

export const getDiffCell = (diff: number): string | number => {
  return diff >= 0 ? `+${diff}` : `${diff}`;
};

export const getClassIcon = (wowClass: string) => {
  const className = specNameFromFullSpec(wowClass).toUpperCase() as WOW_CLASS_ICON;
  if (!Object.values(WOW_CLASS_ICON).includes(className)) return unknownIcon;
  const iconKey = `../assets/classicons/${specNameFromFullSpec(wowClass)}.png`;
  return classIcons[iconKey] || unknownIcon;
};

export const getSpecIcon = (wowSpec: string) => {
  const specName = specNameFromFullSpec(wowSpec) as WOW_SPEC;
  if (!Object.values(WOW_SPEC).includes(specName)) return unknownIcon;
  const iconKey = `../assets/specicons/${specNameFromFullSpec(wowSpec)}.png`;
  return specIcons[iconKey] || unknownIcon;
};

const raceIconOverrides: Partial<Record<WOW_RACE, string>> = {
  fhighmountaintauren: raceIconsJpg['../assets/raceicons/fhighmountaintauren.jpg'],
  mhighmountaintauren: raceIconsJpg['../assets/raceicons/mhighmountaintauren.jpg'],
};

const raceIconAliases: Record<string, string> = {
  lightforgeddraenei: 'lightforged',
};

export const getRaceIcon = (wowGender: string, wowRace: string) => {
  const genderKey = wowGender.toLowerCase().charAt(0);
  const normalizedRace = wowRace.replaceAll(' ', '').replaceAll("'", '').toLowerCase();
  const raceKey = raceIconAliases[normalizedRace] || normalizedRace;
  const raceName = `${genderKey}${raceKey}` as WOW_RACE;
  if (!Object.values(WOW_RACE).includes(raceName)) return unknownIcon;
  if (raceIconOverrides[raceName]) return raceIconOverrides[raceName] as string;
  const webpKey = `../assets/raceicons/${raceName}.webp`;
  if (raceIconsWebp[webpKey]) return raceIconsWebp[webpKey];
  const pngKey = `../assets/raceicons/${raceName}.png`;
  if (raceIconsPng[pngKey]) return raceIconsPng[pngKey];
  const jpgKey = `../assets/raceicons/${raceName}.jpg`;
  if (raceIconsJpg[jpgKey]) return raceIconsJpg[jpgKey];
  return unknownIcon;
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
  return { wonColor: won > 0 ? winGreen : '#FFFFFF', lossColor: loss > 0 ? lossRed : '#FFFFFF' };
};

export const getRatingColor = (in_cutoff: boolean) => {
  return in_cutoff ? '#fb7e00' : '#FFFFFF';
};

export const ratingToColor = (rating: number, is_rank_one_range = false) => {
  if (is_rank_one_range) {
    return '#fb7e00';
  } else if (rating >= 2400) {
    return '#a335ee';
  } else if (rating >= 2100) {
    return '#2b8cb9';
  } else if (rating >= 900) {
    return '#FFFFFF';
  }
  return '#FFFFFF';
};

export const bracketToColor = (bracket: Partial<Bracket>) => {
  const { rating = 0, is_rank_one_range = false } = bracket;
  return ratingToColor(rating, is_rank_one_range);
};

export const getRankImageName = (rank: string): string => {
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
  } else if (rank === 'Unranked') {
    return 'unranked.png';
  } else {
    return 'unranked.png';
  }
};

export const getSeasonRankImage = (rank: string) => {
  const iconKey = `../assets/ranks/${getRankImageName(rank)}`;
  return rankIcons[iconKey] || unknownIcon;
};

export const getRankIconByFileName = (fileName: string) => {
  const iconKey = `../assets/ranks/${fileName}`;
  return rankIcons[iconKey] || unknownIcon;
};

export const getSeasonRankImageFromRating = (rating: number, is_rank_one_range: boolean) => {
  // Unranked	0-1000 -- no picture for it yet
  // Combatant I	1000-1200
  // Combatant II	1200-1400
  // Challenger I	1400-1600
  // Challenger II	1600-1800
  // Rival I	1800-1950
  // Rival II	1950-2100
  // Duelist	2100-2400
  // Elite	2400+
  if (is_rank_one_range) {
    return getSeasonRankImage('r1_3s');
  } else if (rating >= 2400) {
    return getSeasonRankImage('Gladiator');
  } else if (rating >= 2100) {
    return getSeasonRankImage('Duelist');
  } else if (rating >= 1800) {
    return getSeasonRankImage('Rival');
  } else if (rating >= 1400) {
    return getSeasonRankImage('Challenger');
  } else if (rating >= 1000) {
    return getSeasonRankImage('Combatant');
  }
  return getSeasonRankImage('Unranked');
};

type AltProfileTarget = Pick<Player, "region" | "realm" | "name">;

export const getAltProfileUrl = (alt: AltProfileTarget) => {
  return window.location.origin + `/${alt.region}/${alt.realm}/${alt.name}`;
};
