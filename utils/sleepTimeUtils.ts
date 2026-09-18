// Utility functions for sleep time calculations

/**
 * Returns the number of minutes from midnight for a given Date.
 */
export function minutesFromMidnight(value: Date): number {
  return value.getHours() * 60 + value.getMinutes();
}
