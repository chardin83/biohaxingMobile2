import type { DailyHabitTracking, HabitEntry } from '@/app/context/storage/habits/habitTypes';
import { countNewAutomaticHabitGoals, getAutomaticHabitGoalKeys } from '@/services/targetProgress/automaticHabitSummary';

const automatic = (fulfilled: boolean): HabitEntry => ({ value: fulfilled ? 1 : 0, isFulfilled: fulfilled, sourceRevision: 'sleep-record' });

it('counts new automatic daily goals, excluding saved goals, manual logs and unsuccessful checks', () => {
  const saved: DailyHabitTracking = { '2026-10-01': { sleep_schedule_consistency: automatic(true) } };
  const current: DailyHabitTracking = {
    ...saved,
    '2026-10-02': { sleep_schedule_consistency: automatic(true) },
    '2026-10-03': { sleep_schedule_consistency: automatic(true), box_breathing: { value: 3, isFulfilled: true } },
    '2026-10-04': { sleep_schedule_consistency: automatic(false) },
  };
  const baseline = getAutomaticHabitGoalKeys(saved);
  expect(countNewAutomaticHabitGoals(current, baseline)).toBe(2);
  expect(countNewAutomaticHabitGoals(current, baseline)).toBe(2);
  expect(countNewAutomaticHabitGoals(current, getAutomaticHabitGoalKeys(current))).toBe(0);
});

it('counts a corrected result only when it becomes fulfilled', () => {
  const saved = { '2026-10-01': { sleep_schedule_consistency: automatic(false) } };
  const current = { '2026-10-01': { sleep_schedule_consistency: automatic(true) } };
  expect(countNewAutomaticHabitGoals(current, getAutomaticHabitGoalKeys(saved))).toBe(1);
});
