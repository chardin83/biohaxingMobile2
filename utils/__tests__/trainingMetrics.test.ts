import type { DailyTrainingTracking, TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';
import { calculateTrainingWeeklyProgress } from '@/utils/trainingProgress';

import { buildActiveMinutesMetrics, buildHighIntensityMinutesMetrics, buildIntensityMinutesMetrics, buildModerateMinutesMetrics, buildWeightedTrainingMinutesMetrics, summarizeTrainingDay } from '../trainingMetrics';

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
  expect(calculateTrainingWeeklyProgress({ entries: [entry], target: { sessionsPerWeek: 1, minimumIntensity: 'moderate' } }).actual).toBe(0);
});


it('derives intensive minutes from measured workouts and updates when a workout is removed', () => {
  const a = { ...entry, intensityMinutes: 10 };
  const b = { ...entry, id: 'second', intensityMinutes: 5 };
  expect(buildIntensityMinutesMetrics({ [entry.date]: [a, b] })[0]).toMatchObject({ metricId: 'intensity_minutes', value: 15, origin: 'training' });
  expect(buildIntensityMinutesMetrics({ [entry.date]: [b] })[0].value).toBe(5);
  expect(buildIntensityMinutesMetrics({ [entry.date]: [] })).toEqual([]);
});

it('does not infer intense minutes from manual high intensity and preserves measured zero', () => {
  expect(buildIntensityMinutesMetrics({ [entry.date]: [{ ...entry, intensity: 'intense' }] })).toEqual([]);
  expect(buildIntensityMinutesMetrics({ [entry.date]: [{ ...entry, intensityMinutes: 0, intensityIntervals: [] }] })[0].value).toBe(0);
});

it('counts overlapping measured intense intervals only once', () => {
  const a = { ...entry, intensityMinutes: 30, intensityIntervals: [{ startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T10:30:00Z' }] };
  const b = { ...entry, id: 'overlap', intensityMinutes: 30, intensityIntervals: [{ startTime: '2026-10-20T10:15:00Z', endTime: '2026-10-20T10:45:00Z' }] };
  expect(buildIntensityMinutesMetrics({ [entry.date]: [a, b] })[0].value).toBe(45);
});


it('calculates weighted minutes from measured moderate plus twice vigorous, excluding light and missing time', () => {
  const measured = { ...entry, moderateMinutes: 20, intensityMinutes: 10 };
  const unmeasured = { ...entry, id: 'manual', intensity: 'intense' as const, durationMinutes: 200 };
  expect(buildModerateMinutesMetrics({ [entry.date]: [measured, unmeasured] })[0].value).toBe(20);
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [measured, unmeasured] })[0]).toMatchObject({ metricId: 'weighted_training_minutes', value: 40, origin: 'training' });
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [{ ...entry, intensityMinutes: 10 }] })).toEqual([]);
  expect(buildModerateMinutesMetrics({ [entry.date]: [unmeasured] })).toEqual([]);
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [] })).toEqual([]);
});

it('keeps measured zero and weights precise values before rounding', () => {
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [{ ...entry, moderateMinutes: 0, intensityMinutes: 0 }] })[0].value).toBe(0);
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [{ ...entry, moderateMinutes: 0.4, intensityMinutes: 0.4 }] })[0].value).toBe(1);
});

it('deduplicates overlaps across intensity bands, assigning disputed intervals to vigorous activity', () => {
  const moderate = { ...entry, moderateMinutes: 30, intensityMinutes: 0, moderateIntervals: [{ startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T10:30:00Z' }], intensityIntervals: [] };
  const vigorous = { ...entry, id: 'vigorous', moderateMinutes: 0, intensityMinutes: 30, moderateIntervals: [], intensityIntervals: [{ startTime: '2026-10-20T10:15:00Z', endTime: '2026-10-20T10:45:00Z' }] };
  const tracking = { [entry.date]: [moderate, { ...moderate, id: 'copy' }, vigorous] };
  expect(buildModerateMinutesMetrics(tracking)[0].value).toBe(15);
  expect(buildIntensityMinutesMetrics(tracking)[0].value).toBe(30);
  expect(buildWeightedTrainingMinutesMetrics(tracking)[0].value).toBe(75);
});


it('derives high-intensity daily minutes, deduplicates overlaps and updates after deletion', () => {
  const a = { ...entry, highIntensityMinutes: 30, highIntensityIntervals: [{ startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T10:30:00Z' }] };
  const b = { ...entry, id: 'second', highIntensityMinutes: 30, highIntensityIntervals: [{ startTime: '2026-10-20T10:15:00Z', endTime: '2026-10-20T10:45:00Z' }] };
  expect(buildHighIntensityMinutesMetrics({ [entry.date]: [a, b] })[0]).toMatchObject({ metricId: 'high_intensity_minutes', value: 45, origin: 'training' });
  expect(buildHighIntensityMinutesMetrics({ [entry.date]: [b] })[0].value).toBe(30);
  expect(buildHighIntensityMinutesMetrics({ [entry.date]: [] })).toEqual([]);
  expect(buildHighIntensityMinutesMetrics({ [entry.date]: [entry] })).toEqual([]);
  expect(buildHighIntensityMinutesMetrics({ [entry.date]: [{ ...entry, highIntensityMinutes: 0, highIntensityIntervals: [] }] })[0].value).toBe(0);
});

it('never adds high-intensity minutes on top of the existing WHO weighting', () => {
  const measured = { ...entry, moderateMinutes: 20, intensityMinutes: 10, highIntensityMinutes: 5 };
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [measured] })[0].value).toBe(40);
});


it('summarizes the selected day with mutually exclusive intensity bands', () => {
  const running = { ...entry, id: 'run', durationMinutes: 49, startTime: undefined, endTime: undefined, distanceKm: 7, moderateMinutes: 10, intensityMinutes: 39, highIntensityMinutes: 8 };
  const walking = { ...entry, id: 'walk', durationMinutes: 25, startTime: undefined, endTime: undefined, distanceKm: 1.6, moderateMinutes: 8, intensityMinutes: 17, highIntensityMinutes: 2 };
  expect(summarizeTrainingDay([running, walking])).toEqual({ activeMinutes: 74, distanceKm: 8.6, sessionCount: 2, moderateMinutes: 18, intenseMinutes: 46, highIntensityMinutes: 10, lowIntensityMinutes: undefined, classifiedMinutes: 74 });
});

it('keeps unmeasured intensity unknown instead of assigning it to a band', () => {
  expect(summarizeTrainingDay([{ ...entry, durationMinutes: 60 }])).toMatchObject({ activeMinutes: 60, moderateMinutes: undefined, intenseMinutes: undefined, highIntensityMinutes: undefined, lowIntensityMinutes: undefined, classifiedMinutes: 0, distanceKm: undefined });
  expect(summarizeTrainingDay([])).toMatchObject({ activeMinutes: 0, sessionCount: 0, distanceKm: undefined });
  expect(summarizeTrainingDay([{ ...entry, moderateMinutes: 0, intensityMinutes: 0, highIntensityMinutes: 0 }])).toMatchObject({ moderateMinutes: 0, intenseMinutes: 0, highIntensityMinutes: 0, lowIntensityMinutes: undefined, classifiedMinutes: 0 });
});

it('deduplicates active time in the summary and never fills the bar beyond total active time', () => {
  const a = { ...entry, moderateMinutes: 20, intensityMinutes: 40, highIntensityMinutes: 10 };
  const b = { ...a, id: 'overlap' };
  const result = summarizeTrainingDay([a, b]);
  expect(result.activeMinutes).toBe(60);
  expect(result.moderateMinutes! + result.intenseMinutes! + result.highIntensityMinutes!).toBeLessThanOrEqual(result.activeMinutes);
  expect(summarizeTrainingDay([a]).sessionCount).toBe(1);
});


it('counts only measured low intensity and excludes gym and unknown sessions from the distribution', () => {
  const gym = { ...entry, id: 'gym', activityType: 'gym' as const, lowIntensityMinutes: 60 };
  const unknown = { ...entry, id: 'unknown', startTime: undefined, endTime: undefined };
  expect(summarizeTrainingDay([gym, unknown])).toMatchObject({ lowIntensityMinutes: undefined, classifiedMinutes: 0 });
  const measured = { ...entry, id: 'walk', activityType: 'walking' as const, durationMinutes: 60, startTime: undefined, endTime: undefined, lowIntensityMinutes: 10, moderateMinutes: 0, intensityMinutes: 0, highIntensityMinutes: 0 };
  expect(summarizeTrainingDay([measured, gym, unknown])).toMatchObject({ lowIntensityMinutes: 10, classifiedMinutes: 10 });
  expect(summarizeTrainingDay([{ ...measured, lowIntensityMinutes: 0 }])).toMatchObject({ lowIntensityMinutes: 0, classifiedMinutes: 0 });
});

it.each([
  { intensity: 'low', low: 30, moderate: 0, vigorous: 0, high: 0, weighted: 0 },
  { intensity: 'moderate', low: 0, moderate: 30, vigorous: 0, high: 0, weighted: 30 },
  { intensity: 'intense', low: 0, moderate: 0, vigorous: 30, high: 0, weighted: 60 },
  { intensity: 'high', low: 0, moderate: 0, vigorous: 30, high: 30, weighted: 60 },
] as const)('uses explicitly declared manual $intensity consistently in summaries and metrics', ({ intensity, low, moderate, vigorous, high, weighted }) => {
  const manual = { ...entry, origin: 'manual' as const, durationMinutes: 30, startTime: undefined, endTime: undefined, intensity };
  expect(summarizeTrainingDay([manual])).toMatchObject({ lowIntensityMinutes: low, moderateMinutes: moderate, intenseMinutes: vigorous - high, highIntensityMinutes: high, classifiedMinutes: 30 });
  expect(buildModerateMinutesMetrics({ [entry.date]: [manual] })[0].value).toBe(moderate);
  expect(buildIntensityMinutesMetrics({ [entry.date]: [manual] })[0].value).toBe(vigorous);
  expect(buildHighIntensityMinutesMetrics({ [entry.date]: [manual] })[0].value).toBe(high);
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [manual] })[0].value).toBe(weighted);
});

it('updates classification when a manual intensity changes and keeps imported pulse measurements intact', () => {
  const manual = { ...entry, origin: 'manual' as const, durationMinutes: 30, intensity: 'moderate' as const, moderateMinutes: 15, intensityMinutes: 15 };
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [manual] })[0].value).toBe(30);
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [{ ...manual, intensity: 'high', durationMinutes: 20 }] })[0].value).toBe(40);
  expect(buildWeightedTrainingMinutesMetrics({ [entry.date]: [{ ...manual, origin: 'healthkit', intensity: 'high' }] })[0].value).toBe(45);
});

it('includes the fourth level when matching minimum-intensity goals', () => {
  const manual = { ...entry, origin: 'manual' as const, intensity: 'high' as const };
  expect(calculateTrainingWeeklyProgress({ entries: [manual], target: { minimumIntensity: 'high', sessionsPerWeek: 1 } }).actual).toBe(1);
  expect(calculateTrainingWeeklyProgress({ entries: [{ ...manual, intensity: 'intense' }], target: { minimumIntensity: 'high', sessionsPerWeek: 1 } }).actual).toBe(0);
});
