export const getFromSearchParams = (searchParams: URLSearchParams, name: string): string[] => {
  return searchParams?.get(name)?.split(',') || [];
};
