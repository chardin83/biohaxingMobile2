import type { DailyTrainingTracking, TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';
import { calculateTrainingWeeklyProgress } from '@/utils/trainingProgress';

import { buildActiveMinutesMetrics, buildIntensityMinutesMetrics } from '../trainingMetrics';

const entry: TrainingLogEntry = { id: 'run', date: '2026-10-20', activityType: 'running', durationMinutes: 60, createdAt: '', origin: 'healthkit', startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T11:00:00Z' };

it('derives active minutes from manual and imported sessions, counting overlaps once', () => {
  const tracking: DailyTrainingTracking = { [entry.date]: [entry, { ...entry, id: 'overlap', startTime: '2026-10-20T10:30:00Z', endTime: '2026-10-20T11:30:00Z' }, { ...entry, id: 'manual', origin: 'manual', durationMinutes: 20, startTime: undefined, endTime: undefined }] };
  expect(buildActiveMinutesMetrics(tracking)).toEqual([{ metricId: 'active_minutes', value: 110, unit: 'min', origin: 'training', recordedAt: '2026-10-20T00:00:00' }]);
  expect(buildActiveMinutesMetrics({ [entry.date]: [entry] })[0].value).toBe(60);
});

it('does not invent zero activity for missing or cleared days', () => {
  expect(buildActiveMinutesMetrics({})).toEqual([]);
  expect(buildActiveMinutesMetrics({ [entry.date]: [] })).toEqual([]);
  expect(buildActiveMinutesMetrics({ [entry.date]: [{ ...entry, durationMinutes: NaN }] })).toEqual([]);
});

it('counts imported sessions towards goals without inventing an intensity rating', () => {
  expect(calculateTrainingWeeklyProgress({ entries: [entry], target: { sessionsPerWeek: 1, activityType: 'running' } }).isFulfilled).toBe(true);
  expect(calculateTrainingWeeklyProgress({ entries: [entry], target: { sessionsPerWeek: 1, minimumIntensity: 'medium' } }).actual).toBe(0);
});


it('derives intensive minutes from measured workouts and updates when a workout is removed', () => {
  const a = { ...entry, intensityMinutes: 10 };
  const b = { ...entry, id: 'second', intensityMinutes: 5 };
  expect(buildIntensityMinutesMetrics({ [entry.date]: [a, b] })[0]).toMatchObject({ metricId: 'intensity_minutes', value: 15, origin: 'training' });
  expect(buildIntensityMinutesMetrics({ [entry.date]: [b] })[0].value).toBe(5);
  expect(buildIntensityMinutesMetrics({ [entry.date]: [] })).toEqual([]);
});

it('does not infer intense minutes from manual high intensity and preserves measured zero', () => {
  expect(buildIntensityMinutesMetrics({ [entry.date]: [{ ...entry, intensity: 'high' }] })).toEqual([]);
  expect(buildIntensityMinutesMetrics({ [entry.date]: [{ ...entry, intensityMinutes: 0, intensityIntervals: [] }] })[0].value).toBe(0);
});

it('counts overlapping measured intense intervals only once', () => {
  const a = { ...entry, intensityMinutes: 30, intensityIntervals: [{ startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T10:30:00Z' }] };
  const b = { ...entry, id: 'overlap', intensityMinutes: 30, intensityIntervals: [{ startTime: '2026-10-20T10:15:00Z', endTime: '2026-10-20T10:45:00Z' }] };
  expect(buildIntensityMinutesMetrics({ [entry.date]: [a, b] })[0].value).toBe(45);
});
