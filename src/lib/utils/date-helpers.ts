
/**
 * Checks if a value is a valid date
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  
  if (typeof date === 'string') {
    const d = new Date(date);
    return !isNaN(d.getTime());
  }
  
  return false;
};

/**
 * Converts a Date object to an ISO string for API usage
 */
export const dateToString = (date: Date | string): string => {
  if (!date) return '';
  
  if (date instanceof Date) {
    // Check for valid date before converting
    if (!isValidDate(date)) {
      console.error("Invalid date object:", date);
      return '';
    }
    return date.toISOString();
  }
  
  // If already a string, try to parse it to ensure it's valid
  try {
    const dateObj = new Date(date);
    if (!isValidDate(dateObj)) {
      console.error("Invalid date string:", date);
      return String(date);
    }
    return dateObj.toISOString();
  } catch (error) {
    console.error("Invalid date string:", date);
    return String(date);
  }
};

/**
 * Format a date string to a readable format
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (!isValidDate(dateObj)) {
      console.error("Invalid date for formatting:", date);
      return 'Invalid date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting date:", error);
    return 'Invalid date';
  }
};

/**
 * Format a time string to a readable time format
 */
export const formatTime = (time: string | Date): string => {
  if (!time) return 'N/A';
  
  try {
    const dateObj = typeof time === 'string' ? new Date(time) : time;
    
    // Check if date is valid
    if (!isValidDate(dateObj)) {
      console.error("Invalid time for formatting:", time);
      return 'Invalid time';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(dateObj);
  } catch (error) {
    console.error("Error formatting time:", error);
    return 'Invalid time';
  }
};

/**
 * Safely formats a time range
 */
export const formatTimeRange = (startTime: string | Date | null | undefined, endTime: string | Date | null | undefined): string => {
  if (!startTime && !endTime) return 'N/A';
  
  const formattedStart = startTime ? formatTime(startTime) : 'N/A';
  const formattedEnd = endTime ? formatTime(endTime) : 'N/A';
  
  return `${formattedStart} - ${formattedEnd}`;
};

/**
 * Gets the day of week from a date (1 = Sunday, 7 = Saturday)
 */
export const getDayOfWeek = (date: Date | string): number => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getDay() + 1; // JavaScript getDay() returns 0-6
};
