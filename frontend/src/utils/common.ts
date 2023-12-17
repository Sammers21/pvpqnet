export function capitalizeFirstLetter(str?: string) {
  if (!str) return;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const MINIMUM_NICKNAME_LENGTH = 9;

export function nickNameLenOnMobile() {
  return Math.round(Math.max(MINIMUM_NICKNAME_LENGTH, 6 + (window.innerWidth - 500) / 30));
}