import difference from 'lodash/difference';

export const isExistsInAnotherArray = (arr1: unknown[], arr2: unknown[]): boolean => {
  return difference(arr1, arr2).length === 0;
};
