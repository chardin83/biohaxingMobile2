// Utility functions for sleep time calculations
import type { ClockTime } from '@/types/ClockTime';

export const DEFAULT_BEDTIME: ClockTime = '23:00';

/**
 * Returns the number of minutes from midnight for a given Date.
 */
export function minutesFromMidnight(value: Date): number {
  return value.getHours() * 60 + value.getMinutes();
}
