import { BRACKETS } from '../constants/pvp-activity';
import { REGIONS } from '../constants/region';

export function getBracket(bracket?: string) {
  const validBracket = Object.values(BRACKETS).find((r) => bracket === r);
  return validBracket ?? BRACKETS.shuffle;
}

export function getRegion(region?: string) {
  const validRegion = Object.values(REGIONS).find((r) => region === r);
  return validRegion ?? REGIONS.eu;
}

export function getActivity(activity: string) {
  const validActivity = Object.values(['activity', 'ladder']).find((r) => activity === r);
  return validActivity ?? 'activity';
}

export function getActivityFromUrl() {
  const splitx = window.location.pathname.split('/');
  return splitx.length >= 4 ? splitx[2] : 'activity';
}

export function capitalizeNickname(nickname?: string) {
  if (nickname === undefined || nickname === '') return '';

  function capitalize(s?: string) {
    return s && s[0].toUpperCase() + s.slice(1);
  }

  const nicknameParts = nickname.split('-');
  const realm = capitalize(nicknameParts[1]);
  const name = capitalize(nicknameParts[0]);

  return nicknameParts.length > 2
    ? `${name}-${realm} ${capitalize(nicknameParts[2])}`
    : `${name}-${realm}`;
}
