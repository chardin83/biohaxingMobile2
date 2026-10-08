import { tips } from '@/locales/tips';
import { logHabitTarget } from '@/services/targetProgress/habitTrackingService';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';
import { type TargetProgressStorage } from '@/services/targetProgress/targetProgressService';
import type { HabitTargetDefinition } from '@/services/targetProgress/targetProgressTypes';

const date = '2026-10-07';
const targetFor = (id: string): HabitTargetDefinition => {
  const tip = tips.find(item => item.id === id)!;
  return { ...tip.habitTargets![0], source: 'habit', period: tip.targetPeriod! };
};
const storage = (): TargetProgressStorage => ({
  dailyHabitTracking: {},
  dailyTrainingTracking: {},
  dailyNutritionTracking: {},
  weeklyNutritionTracking: {},
  takenDates: {},
});

it('gives breathing and sleep tips independent targets and makes them available in the habits plan', () => {
  const expected = [
    ['sleep_environment_optimization', 'sleep_environment', 1, 'count', 'daily-check'],
    ['sleep_hygiene_practices', 'sleep_hygiene', 1, 'count', 'daily-check'],
    ['pre_sleep_wind_down', 'pre_sleep_wind_down', 30, 'minutes', 'number'],
    ['sleep_timing_circadian', 'sleep_schedule_consistency', 1, 'count', 'automatic'],
    ['box_breathing', 'box_breathing', 3, 'minutes', 'number'],
    ['4_7_8_breathing', 'breathing_4_7_8', 1, 'count', 'daily-check'],
    ['alternate_nostril_breathing', 'alternate_nostril_breathing', 3, 'minutes', 'number'],
    ['diaphragmatic_breathing', 'diaphragmatic_breathing', 5, 'minutes', 'number'],
  ] as const;
  for (const [id, trackingKey, amount, unit, inputMode] of expected) {
    const tip = tips.find(item => item.id === id)!;
    expect(tip.planCategory).toContain('other');
    expect(tip.targetPeriod).toBe('daily');
    expect(tip.habitTargets).toEqual([{ trackingKey, amount, unit, inputMode }]);
  }
});

it('counts a daily check once, supports undo, and does not complete another breathing target', () => {
  const data = storage();
  const target = targetFor('4_7_8_breathing');
  const completed = logHabitTarget({ value: 1, slot: 'daily' });
  data.dailyHabitTracking[date] = { [target.trackingKey]: logHabitTarget({ existing: completed, value: 1, slot: 'daily' }) };
  expect(getTargetProgress({ target, selectedDate: date, storage: data })).toMatchObject({ current: 1, isFulfilled: true });
  expect(getTargetProgress({ target: targetFor('box_breathing'), selectedDate: date, storage: data }).isFulfilled).toBe(false);
  data.dailyHabitTracking[date][target.trackingKey] = logHabitTarget({ existing: completed, value: 0, slot: 'daily' });
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(false);
});

it('completes box breathing at three logged minutes and starts fresh on another day', () => {
  const data = storage();
  const target = targetFor('box_breathing');
  data.dailyHabitTracking[date] = { [target.trackingKey]: logHabitTarget({ value: 2 }) };
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(false);
  data.dailyHabitTracking[date][target.trackingKey] = logHabitTarget({ value: 3 });
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(true);
  expect(getTargetProgress({ target, selectedDate: '2026-10-08', storage: data })).toMatchObject({ current: 0, isFulfilled: false });
});

it.each([
  ['alternate_nostril_breathing', 3],
  ['diaphragmatic_breathing', 5],
] as const)('tracks %s independently and completes at its minute target', (id, minutes) => {
  const data = storage();
  const target = targetFor(id);
  data.dailyHabitTracking[date] = { [target.trackingKey]: logHabitTarget({ value: minutes - 1 }) };
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(false);
  data.dailyHabitTracking[date][target.trackingKey] = logHabitTarget({ value: minutes });
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(true);
  const otherId = id === 'alternate_nostril_breathing' ? 'diaphragmatic_breathing' : 'alternate_nostril_breathing';
  expect(getTargetProgress({ target: targetFor(otherId), selectedDate: date, storage: data })).toMatchObject({ current: 0, isFulfilled: false });
});

it.each(['sleep_environment_optimization', 'sleep_hygiene_practices'])('tracks %s as an independent daily check', id => {
  const data = storage();
  const target = targetFor(id);
  const completed = logHabitTarget({ value: 1, slot: 'daily' });
  data.dailyHabitTracking[date] = { [target.trackingKey]: logHabitTarget({ existing: completed, value: 1, slot: 'daily' }) };
  expect(getTargetProgress({ target, selectedDate: date, storage: data })).toMatchObject({ current: 1, isFulfilled: true });
  const otherId = id === 'sleep_environment_optimization' ? 'sleep_hygiene_practices' : 'sleep_environment_optimization';
  expect(getTargetProgress({ target: targetFor(otherId), selectedDate: date, storage: data }).isFulfilled).toBe(false);
  expect(getTargetProgress({ target, selectedDate: '2026-10-08', storage: data }).isFulfilled).toBe(false);
  data.dailyHabitTracking[date][target.trackingKey] = logHabitTarget({ existing: completed, value: 0, slot: 'daily' });
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(false);
});

it('completes wind-down at 30 minutes without completing the sleep checks', () => {
  const data = storage();
  const target = targetFor('pre_sleep_wind_down');
  data.dailyHabitTracking[date] = { [target.trackingKey]: logHabitTarget({ value: 29 }) };
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(false);
  data.dailyHabitTracking[date][target.trackingKey] = logHabitTarget({ value: 30 });
  expect(getTargetProgress({ target, selectedDate: date, storage: data }).isFulfilled).toBe(true);
  expect(getTargetProgress({ target: targetFor('sleep_environment_optimization'), selectedDate: date, storage: data }).isFulfilled).toBe(false);
  expect(getTargetProgress({ target: targetFor('sleep_hygiene_practices'), selectedDate: date, storage: data }).isFulfilled).toBe(false);
});
