import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { buildSyncedRecoveryMetrics, refreshRecoveryAfterMetricChanges } from '../recoveryMetrics';

const day = (date: string, hrv = 50): MetricEntry[] => [
  { metricId: 'resting_hr', value: 60, unit: 'bpm', recordedAt: `${date}T12:00:00.000Z` },
  { metricId: 'sleep_duration', value: 480, unit: 'min', recordedAt: `${date}T12:00:00.000Z` },
  { metricId: 'hrv_rmssd', value: hrv, unit: 'ms', recordedAt: `${date}T12:00:00.000Z` },
];

it('uses saved baselines and only creates scores for the synced period', () => {
  expect(buildSyncedRecoveryMetrics(day('2026-10-04'), day('2026-10-05'))).toEqual([
    expect.objectContaining({ metricId: 'recovery_status', value: 70, unit: 'score_0_100', recordedAt: '2026-10-05T00:00:00.000Z' }),
  ]);
});

it('replaces duplicate source samples with fresh synced values', () => {
  const saved = [...day('2026-10-04'), ...day('2026-10-05', 20)];
  expect(buildSyncedRecoveryMetrics(saved, day('2026-10-05'))[0].value).toBe(70);
});

it('does not invent scores without baseline data or matching daily measurements', () => {
  expect(buildSyncedRecoveryMetrics([], day('2026-10-05'))).toEqual([]);
  expect(buildSyncedRecoveryMetrics(day('2026-10-04'), day('2026-10-05').slice(0, 2))).toEqual([]);
  expect(buildSyncedRecoveryMetrics(day('2026-10-04'), [])).toEqual([]);
});

it('recalculates and persists the affected day and subsequent baseline days after an edit', () => {
  const source = [...day('2026-10-04'), ...day('2026-10-05'), ...day('2026-10-06')];
  const previous = [...source, ...buildSyncedRecoveryMetrics([], source)];
  const updated = previous.map(entry => entry.metricId === 'hrv_rmssd' && entry.recordedAt.startsWith('2026-10-05') ? { ...entry, value: 100 } : entry);
  const refreshed = refreshRecoveryAfterMetricChanges(previous, updated);
  const score = (date: string) => refreshed.find(entry => entry.metricId === 'recovery_status' && entry.recordedAt.startsWith(date))?.value;
  expect(score('2026-10-05')).toBe(84);
  expect(score('2026-10-06')).toBe(60);
  expect(refreshed.filter(entry => entry.metricId === 'recovery_status' && entry.recordedAt.startsWith('2026-10-05'))).toHaveLength(1);
});

it('removes a stale score when a required measurement is deleted', () => {
  const source = [...day('2026-10-04'), ...day('2026-10-05')];
  const previous = [...source, ...buildSyncedRecoveryMetrics([], source)];
  const updated = previous.filter(entry => !(entry.metricId === 'sleep_duration' && entry.recordedAt.startsWith('2026-10-05')));
  expect(refreshRecoveryAfterMetricChanges(previous, updated).filter(entry => entry.metricId === 'recovery_status')).toEqual([]);
});

it('preserves saved scores without recalculating for unrelated edits', () => {
  const previous = [...day('2026-10-04'), ...day('2026-10-05')];
  const updated: MetricEntry[] = [...previous, { metricId: 'vo2_max', value: 40, unit: 'ml/kg/min', recordedAt: '2026-10-05T12:00:00.000Z' }];
  expect(refreshRecoveryAfterMetricChanges(previous, updated)).toBe(updated);
});
