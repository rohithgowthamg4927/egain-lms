
/**
 * Converts a Date object to an ISO string for API usage
 */
export const dateToString = (date: Date | string): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date;
};
