// Utility functions for sleep time calculations

/**
 * Returns the number of minutes from midnight for a given Date.
 */
export function minutesFromMidnight(value: Date): number {
  return value.getHours() * 60 + value.getMinutes();
}

/**
 * Formats a Date as a clock time string (e.g., 22:30).
 * Locale is provided for correct formatting.
 */
export function formatClockTime(value: Date, locale: string = 'sv-SE'): string {
  return value.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
