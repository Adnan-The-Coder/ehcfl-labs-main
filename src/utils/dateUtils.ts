/**
 * Date utilities for India Standard Time (IST) handling
 * IST is UTC+05:30
 */

/**
 * Get current date in IST formatted as YYYY-MM-DD
 * @param offsetDays - Days offset from today (0 = today, 1 = tomorrow, etc)
 * @returns Date string in YYYY-MM-DD format
 */
export function getISTDateString(offsetDays = 0): string {
  const now = new Date();
  
  // Create a date in IST by adding the offset
  const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  
  // Add days offset
  istDate.setDate(istDate.getDate() + offsetDays);
  
  // Format as YYYY-MM-DD
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object to YYYY-MM-DD (local timezone)
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string is in the past (compared to today in IST)
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if date is in the past
 */
export function isPastDate(dateString: string): boolean {
  const istToday = getISTDateString(0);
  return dateString < istToday;
}

/**
 * Get minimum selectable date (today in IST)
 * @returns Date object representing today in IST
 */
export function getMinSelectableDate(): Date {
  const now = new Date();
  const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const today = new Date(istDate);
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

/**
 * Get maximum selectable date (15 days from today in IST)
 * @returns Date object representing max selectable date
 */
export function getMaxSelectableDate(): Date {
  const maxDate = getMinSelectableDate();
  maxDate.setDate(maxDate.getDate() + 15);
  return maxDate;
}
