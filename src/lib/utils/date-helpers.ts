
/**
 * Converts a Date object to an ISO string for API usage
 */
export const dateToString = (date: Date | string): string => {
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  // If already a string, try to parse it to ensure it's valid
  try {
    return new Date(date).toISOString();
  } catch (error) {
    console.error("Invalid date string:", date);
    return date;
  }
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return String(date);
  }
};
