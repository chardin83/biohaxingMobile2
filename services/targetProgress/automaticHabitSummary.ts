import type { DailyHabitTracking } from '@/app/context/storage/habits/habitTypes';

export function getAutomaticHabitGoalKeys(tracking: DailyHabitTracking): Set<string> {
  const fulfilled = new Set<string>();
  for (const [date, entries] of Object.entries(tracking)) {
    for (const [key, entry] of Object.entries(entries)) {
      if (entry.sourceRevision && entry.isFulfilled === true) fulfilled.add(`${date}|${key}`);
    }
  }
  return fulfilled;
}

export function countNewAutomaticHabitGoals(tracking: DailyHabitTracking, previousGoals: ReadonlySet<string>): number {
  let count = 0;
  for (const key of getAutomaticHabitGoalKeys(tracking)) {
    if (!previousGoals.has(key)) count += 1;
  }
  return count;
}
