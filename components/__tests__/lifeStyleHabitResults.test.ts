import type { LifeStyleLog } from '@/app/context/storage/lifeStyle/lifeStyleTypes';
import type { PlanTipEntry } from '@/app/context/storage/plans/planTypes';
import { tips } from '@/locales/tips';
import { storeLifeStyleHabitResults } from '@/services/targetProgress/lifeStyleHabitResults';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';

const date = '2026-10-15';
const plans = [{ tipId: 'pre_sleep_wind_down', startedAt: '2026-10-01T12:00:00Z' }] as PlanTipEntry[];
const log: LifeStyleLog = { [date]: {
  dimmedLights: { value: false, recordedAt: date },
  calmActivity: { value: true, recordedAt: date },
  reducedScreens: { value: false, recordedAt: date },
} };

it('stores a separate fulfilled target result without copying lifestyle answers', () => {
  const tracking = storeLifeStyleHabitResults({}, log, plans, date);
  expect(tracking[date].pre_sleep_wind_down).toEqual({ source: 'lifeStyle', value: 3, targetAmount: 3, isFulfilled: true });
  expect(storeLifeStyleHabitResults(tracking, log, plans, date)).toBe(tracking);
  const target = tips.find(tip => tip.id === 'pre_sleep_wind_down')!.habitTargets![0];
  expect(getTargetProgress({
    target: { ...target, source: 'habit', period: 'daily' }, selectedDate: date,
    storage: { dailyHabitTracking: tracking, dailyNutritionTracking: {}, weeklyNutritionTracking: {}, dailyTrainingTracking: {}, takenDates: {} },
  })).toMatchObject({ current: 3, target: 3, isFulfilled: true });
});

it('updates the saved result when an answer is removed and removes the result when all answers are gone', () => {
  const completed = storeLifeStyleHabitResults({}, log, plans, date);
  const partial: LifeStyleLog = { [date]: { dimmedLights: log[date].dimmedLights } };
  const updated = storeLifeStyleHabitResults(completed, partial, plans, date);
  expect(updated[date].pre_sleep_wind_down).toMatchObject({ value: 1, targetAmount: 3, isFulfilled: false });
  expect(storeLifeStyleHabitResults(updated, {}, plans, date)).toEqual({});
});

it('does not store target results without an active plan or for future dates', () => {
  expect(storeLifeStyleHabitResults({}, log, [], date)).toEqual({});
  expect(storeLifeStyleHabitResults({}, log, plans, '2026-10-14')).toEqual({});
  expect(storeLifeStyleHabitResults({}, log, [{ ...plans[0], startedAt: '2026-10-16' }], date)).toEqual({});
});
