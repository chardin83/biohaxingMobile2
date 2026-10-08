import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { storeAutomaticSleepResults } from '@/services/targetProgress/habitResultStorage';
import { getSleepScheduleAssessment, getSleepScheduleValue } from '@/services/targetProgress/sleepScheduleProgress';
import { getTargetProgress } from '@/services/targetProgress/targetProgressService';

const date = '2026-10-08';
const entry = (value: number, recordedAt = '2026-10-08T12:00:00'): MetricEntry => ({ metricId: 'sleep_bedtime', value, unit: 'min_from_midnight', recordedAt });

it('uses the configured bedtime with a 30-minute tolerance', () => {
  expect(getSleepScheduleValue(date, [entry(22 * 60)], { bedtime: '22:00' })).toBe(1);
  expect(getSleepScheduleValue(date, [entry(22 * 60 + 30)], { bedtime: '22:00' })).toBe(1);
  expect(getSleepScheduleValue(date, [entry(22 * 60 + 31)], { bedtime: '22:00' })).toBe(0);
  expect(getSleepScheduleValue(date, [entry(22 * 60)], { bedtime: '23:00' })).toBe(0);
});

it('compares across midnight and uses the latest log for the selected date', () => {
  expect(getSleepScheduleValue(date, [entry(5)], { bedtime: '23:50' })).toBe(1);
  expect(getSleepScheduleValue(date, [entry(22 * 60, '2026-10-08T08:00:00'), entry(23 * 60)], { bedtime: '22:00' })).toBe(0);
  expect(getSleepScheduleValue('2026-10-09', [entry(22 * 60)], { bedtime: '22:00' })).toBe(0);
});

it('rejects missing and invalid data and ignores the old manual checkbox', () => {
  expect(getSleepScheduleValue(date, [], { bedtime: '22:00' })).toBe(0);
  expect(getSleepScheduleValue(date, [entry(Number.NaN)], { bedtime: '22:00' })).toBe(0);
  expect(getSleepScheduleValue(date, [entry(1320)], { bedtime: '99:00' })).toBe(0);
  expect(getSleepScheduleValue(date, [entry(1380)], {})).toBe(1);
  const storage = {
    dailyHabitTracking: { [date]: { sleep_schedule_consistency: { value: 1 } } },
    dailyNutritionTracking: {},
    weeklyNutritionTracking: {},
    dailyTrainingTracking: {},
    takenDates: {},
    metricEntries: [] as MetricEntry[],
    userProfile: { bedtime: '22:00' as const },
  };
  const target = { source: 'habit' as const, trackingKey: 'sleep_schedule_consistency', amount: 1, unit: 'count', period: 'daily' as const };
  expect(getTargetProgress({ target, selectedDate: date, storage }).isFulfilled).toBe(false);
  storage.metricEntries = [entry(1320)];
  storage.dailyHabitTracking = storeAutomaticSleepResults(
    storage.dailyHabitTracking,
    storage.metricEntries,
    [
      {
        tipId: 'sleep_timing_circadian',
        startedAt: '2026-10-01T12:00:00',
        createdBy: 'test',
        editedAt: '2026-10-01T12:00:00',
        editedBy: 'test',
        planCategory: 'other',
      },
    ],
    storage.userProfile
  ) as typeof storage.dailyHabitTracking;
  expect(getTargetProgress({ target, selectedDate: date, storage }).isFulfilled).toBe(true);
});

it('distinguishes missing data from a checked failure for yesterday and exposes the compared times', () => {
  const yesterday = '2026-10-07';
  expect(getSleepScheduleAssessment(yesterday, [entry(1320)], { bedtime: '22:00' })).toEqual({ status: 'noData' });
  expect(getSleepScheduleAssessment(yesterday, [entry(1380, '2026-10-07T12:00:00')], { bedtime: '22:00' })).toEqual({
    status: 'notFulfilled',
    actualBedtime: '23:00',
    targetBedtime: '22:00',
    deviationMinutes: 60,
  });
  expect(getSleepScheduleAssessment(yesterday, [entry(1320, '2026-10-07T12:00:00')], { bedtime: '22:00' })).toEqual({
    status: 'fulfilled',
    actualBedtime: '22:00',
    targetBedtime: '22:00',
    deviationMinutes: 0,
  });
  expect(getSleepScheduleAssessment(yesterday, [entry(1320, 'invalid')], { bedtime: '22:00' }).status).toBe('noData');
});
