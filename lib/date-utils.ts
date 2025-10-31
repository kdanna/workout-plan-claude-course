import { format } from 'date-fns';

/**
 * Custom format function for consistent date display
 * Format: "1st Sep 2025", "2nd Aug 2025", etc.
 */
export function formatStandardDate(date: Date): string {
  return format(date, 'do MMM yyyy');
}
