import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { METRIC_SOURCE_PRIORITIES, SLEEP_SOURCE_PRIORITY } from '@/constants/MetricSourcePriority';

import { metricSourceRank, prioritizeSyncedMetrics, selectMetricSourcesByDay } from '../metricSourcePriority';
import { normalizeSleep, type SleepInterval } from '../normalizeSleep';
import { reconcileSyncedMetrics } from '../reconcileSyncedMetrics';

it('uses the selected sleep order for all related sleep metrics', () => {
  for (const id of ['sleep_duration', 'deep_sleep', 'rem_sleep', 'sleep_bedtime'] as const) {
    expect(METRIC_SOURCE_PRIORITIES[id]).toBe(SLEEP_SOURCE_PRIORITY);
  }
});

it('uses different source priorities for sleep, VO2 max and activity', () => {
  const oura = { sourceId: 'com.ouraring.oura' };
  const garmin = { sourceId: 'com.garmin.android.apps.connectmobile' };
  expect(metricSourceRank('sleep_duration', oura)).toBeLessThan(metricSourceRank('sleep_duration', garmin));
  expect(metricSourceRank('active_minutes', garmin)).toBeLessThan(metricSourceRank('active_minutes', oura));
  expect(metricSourceRank('vo2_max', garmin)).toBeLessThan(metricSourceRank('vo2_max', oura));
});

it('uses original metadata, not the HealthKit transport name or a guessed Connect brand', () => {
  expect(metricSourceRank('sleep_duration', { sourceName: 'Connect' })).toBeGreaterThan(metricSourceRank('sleep_duration', { sourceName: 'Oura' }));
  expect(metricSourceRank('sleep_duration', { sourceName: 'HealthKit' })).toBe(METRIC_SOURCE_PRIORITIES.sleep_duration!.length);
});

it('falls back only on days where the preferred source has no values', () => {
  const items = [
    { date: '2026-10-20', sourceId: 'oura', value: 10 },
    { date: '2026-10-20', sourceId: 'garmin', value: 99 },
    { date: '2026-10-21', sourceId: 'garmin', value: 20 },
  ];
  expect(selectMetricSourcesByDay(items, 'sleep_duration')).toEqual([items[0], items[2]]);
});

it('keeps the same sleep source when another device reports more staged sleep', () => {
  const interval = (sourceId: string, endTime: string): SleepInterval => ({ sourceId, startTime: '2026-10-20T00:00:00Z', endTime, state: 'deep' });
  const oura = interval('oura', '2026-10-20T07:00:00Z');
  const garmin = interval('garmin', '2026-10-20T09:00:00Z');
  expect(normalizeSleep([garmin, oura], 'healthkit')[0]).toMatchObject({ sourceId: 'oura', durationMinutes: 420 });
  expect(normalizeSleep([{ ...garmin, endTime: '2026-10-20T10:00:00Z' }, oura], 'healthkit')[0].sourceId).toBe('oura');
});

it('retains all samples from the preferred provider and keeps HRV types separate', () => {
  const entry: MetricEntry = { metricId: 'hrv_rmssd', origin: 'healthconnect', sourceId: 'garmin', value: 40, unit: 'ms', recordedAt: '2026-10-20T12:00:00Z' };
  const second = { ...entry, recordedAt: '2026-10-20T12:05:00Z' };
  const competing = { ...entry, sourceId: 'oura' };
  const sdnn = { ...entry, metricId: 'hrv_sdnn' as const, sourceId: 'apple' };
  expect(prioritizeSyncedMetrics([entry, second, competing, sdnn])).toEqual([entry, second, sdnn]);
});

it('removes previously selected imported source values when the selected source changes, retaining manual values', () => {
  const old: MetricEntry = { metricId: 'resting_hr', origin: 'healthkit', sourceId: 'garmin', value: 55, unit: 'bpm', recordedAt: '2026-10-20T00:00:00Z' };
  const manual = { ...old, origin: 'manual' as const };
  expect(reconcileSyncedMetrics([old, manual], [{ ...old, sourceId: 'apple' }])).toEqual([manual]);
});

it('falls back when a higher-priority source has an invalid value', () => {
  const entry: MetricEntry = { metricId: 'resting_hr', origin: 'healthconnect', sourceId: 'apple', value: NaN, unit: 'bpm', recordedAt: '2026-10-20T12:00:00Z' };
  const valid = { ...entry, sourceId: 'garmin', value: 55 };
  expect(prioritizeSyncedMetrics([entry, valid])).toEqual([valid]);
});

it.each(['com.elink.fittrackhealth', 'com.elink.fittrackhealth.pro'])('recognizes the verified Hume app ID %s without a display name', sourceId => {
  expect(metricSourceRank('sleep_duration', { sourceId })).toBe(SLEEP_SOURCE_PRIORITY.indexOf('hume'));
});

it('recognizes the published Hume Health app name when a source ID is unavailable', () => {
  expect(metricSourceRank('sleep_duration', { sourceName: 'Hume Health' })).toBe(SLEEP_SOURCE_PRIORITY.indexOf('hume'));
});

it.each(['Hume Band', 'Human Activity', 'example.humehealth.app', 'com.elink.fittrackhealth.pro.fake'])('does not treat an unverified source %s as a verified Hume identity', value => {
  expect(metricSourceRank('sleep_duration', { sourceId: value, sourceName: value })).toBe(SLEEP_SOURCE_PRIORITY.length);
});
