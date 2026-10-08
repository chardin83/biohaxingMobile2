import type { DailyHabitTracking } from '@/app/context/storage/habits/habitTypes';
import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { PlanTipEntry } from '@/app/context/storage/plans/planTypes';
import { prepareManualHabitResult, storeAutomaticSleepResults } from '@/services/targetProgress/habitResultStorage';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';

const plan = (tipId: string, start = '2020-01-02'): PlanTipEntry => ({
  tipId,
  startedAt: `${start}T12:00:00`,
  planCategory: 'other',
  createdBy: 'test',
  editedBy: 'test',
  editedAt: `${start}T12:00:00`,
});
const record = (date: string, value: number): MetricEntry => ({ metricId: 'sleep_bedtime', value, unit: 'min_from_midnight', recordedAt: `${date}T12:00:00` });

it('never logs automatic or manual results before the plan start', () => {
  const plans = [plan('sleep_timing_circadian'), plan('box_breathing')];
  expect(prepareManualHabitResult(plans, 'box_breathing', '2020-01-01', { value: 3 })).toBeUndefined();
  expect(prepareManualHabitResult(plans, 'box_breathing', '2020-01-02', { value: 3 })).toMatchObject({ isFulfilled: true });
  const results = storeAutomaticSleepResults({}, [record('2020-01-01', 1320), record('2020-01-02', 1320)], plans, { bedtime: '22:00' });
  expect(results['2020-01-01']).toBeUndefined();
  expect(results['2020-01-02'].sleep_schedule_consistency.isFulfilled).toBe(true);
});

it('persists successful and failed results and never changes them on a bedtime settings change', () => {
  const plans = [plan('sleep_timing_circadian')];
  const entries = [record('2020-01-02', 1320), record('2020-01-03', 1380)];
  const results = storeAutomaticSleepResults({}, entries, plans, { bedtime: '22:00' });
  expect(results['2020-01-03'].sleep_schedule_consistency.isFulfilled).toBe(false);
  const restored = JSON.parse(JSON.stringify(results));
  const next = storeAutomaticSleepResults(restored, entries, plans, { bedtime: '23:00' });
  expect(next).toBe(restored);
  expect(next['2020-01-02'].sleep_schedule_consistency.sleepSchedule?.targetBedtime).toBe('22:00');
  const withNewDay = storeAutomaticSleepResults(next, [...entries, record('2020-01-04', 1380)], plans, { bedtime: '23:00' });
  expect(withNewDay['2020-01-04'].sleep_schedule_consistency.isFulfilled).toBe(true);
  expect(withNewDay['2020-01-03']).toBe(next['2020-01-03']);
});

it('evaluates corrected logs using the original saved goal', () => {
  const plans = [plan('sleep_timing_circadian')];
  const saved = storeAutomaticSleepResults({}, [record('2020-01-02', 1320)], plans, { bedtime: '22:00' });
  const corrected = storeAutomaticSleepResults(saved, [record('2020-01-02', 1380)], plans, { bedtime: '23:00' });
  expect(corrected['2020-01-02'].sleep_schedule_consistency).toMatchObject({ isFulfilled: false, sleepSchedule: { targetBedtime: '22:00' } });
});

it('rejects manual writes to automatic targets, inactive targets and future days', () => {
  expect(prepareManualHabitResult([plan('sleep_timing_circadian')], 'sleep_schedule_consistency', '2020-01-02', { value: 1 })).toBeUndefined();
  expect(prepareManualHabitResult([], 'box_breathing', '2020-01-02', { value: 3 })).toBeUndefined();
  expect(prepareManualHabitResult([plan('box_breathing')], 'box_breathing', '2999-01-02', { value: 3 })).toBeUndefined();
});

it('progress uses the saved result even when current settings or target amount differ', () => {
  const dailyHabitTracking: DailyHabitTracking = { '2020-01-02': { box_breathing: { value: 3, targetAmount: 3, isFulfilled: true } } };
  const result = getTargetProgress({
    target: { source: 'habit', period: 'daily', trackingKey: 'box_breathing', amount: 10, unit: 'minutes' },
    selectedDate: '2020-01-02',
    storage: { dailyHabitTracking, dailyNutritionTracking: {}, weeklyNutritionTracking: {}, dailyTrainingTracking: {}, takenDates: {} },
  });
  expect(result.isFulfilled).toBe(true);
});
