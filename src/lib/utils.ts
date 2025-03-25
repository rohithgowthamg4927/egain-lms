
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random password of specified length
 * @param length Length of the password
 * @returns Random password string
 */
export function generateRandomPassword(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  let password = "";
  
  // Ensure at least one uppercase, lowercase, number and special character
  password += chars.slice(0, 26).charAt(Math.floor(Math.random() * 26)); // uppercase
  password += chars.slice(26, 52).charAt(Math.floor(Math.random() * 26)); // lowercase
  password += chars.slice(52, 62).charAt(Math.floor(Math.random() * 10)); // number
  password += chars.slice(62).charAt(Math.floor(Math.random() * (chars.length - 62))); // special
  
  // Fill remaining length with random characters
  for (let i = 4; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Format a date to a readable string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(d);
}

/**
 * Format a time to a readable string
 * @param date Date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date | string): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(d);
}

/**
 * Get time options from 5pm to 10pm in 30-minute increments
 * @returns Array of time options for schedules
 */
export function getTimeOptions(): { label: string; value: string }[] {
  const options = [];
  const baseTime = new Date();
  baseTime.setHours(17, 0, 0, 0); // 5:00 PM
  
  for (let i = 0; i < 11; i++) { // 11 half-hour increments from 5pm to 10pm
    const time = new Date(baseTime);
    time.setMinutes(baseTime.getMinutes() + (i * 30));
    
    const value = time.toISOString();
    const label = formatTime(time);
    
    options.push({ label, value });
  }
  
  return options;
}

/**
 * Get the initials from a name
 * @param name Full name
 * @returns Initials (up to 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

/**
 * Truncate text to a certain length
 * @param text Text to truncate
 * @param length Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, length: number = 50): string {
  if (!text) return '';
  if (text.length <= length) return text;
  
  return text.substring(0, length) + '...';
}
