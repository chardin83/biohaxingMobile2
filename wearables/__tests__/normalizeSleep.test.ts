import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { normalizeSleep, type SleepInterval, type SleepState } from '../normalizeSleep';
import { reconcileSyncedMetrics } from '../reconcileSyncedMetrics';

const interval = (sourceId: string, start: string, end: string, state: SleepState = 'asleep', id = `${sourceId}-${start}`): SleepInterval => ({
  sourceId, sourceRecordId: id, startTime: `2026-10-20T${start}:00Z`, endTime: `2026-10-20T${end}:00Z`, state, provenanceVersion: 1,
});

it('does not double-count the same night from two sources and is independent of import order', () => {
  const inputs = [interval('a', '00:00', '08:00'), interval('b', '00:00', '08:00')];
  const days = normalizeSleep(inputs, 'healthkit');
  expect(days[0].durationMinutes).toBe(480);
  expect(days[0].sourceId).toBe('a');
  expect(normalizeSleep([...inputs].reverse(), 'healthkit')).toEqual(days);
});

it('takes total sleep, deep and REM from the same selected source', () => {
  const days = normalizeSleep([
    interval('com.garmin.connect', '00:00', '08:00'),
    interval('com.ouraring.oura', '00:00', '02:00', 'deep'), interval('com.ouraring.oura', '02:00', '04:00', 'rem'),
    interval('com.ouraring.oura', '04:00', '07:00', 'light'), interval('com.ouraring.oura', '07:00', '08:00', 'awake'),
  ], 'healthkit');
  expect(days[0]).toMatchObject({ sourceId: 'com.ouraring.oura', durationMinutes: 420, stages: { deepMinutes: 120, remMinutes: 120, lightMinutes: 180, awakeMinutes: 60 } });
  expect(days[0].sourceRecords?.every(record => record.sourceId === 'com.ouraring.oura')).toBe(true);
});

it('uses Health Connect contributing sources before its automatic detail preference', () => {
  const inputs = [interval('preferred', '00:00', '08:00'), interval('detailed', '00:00', '08:00', 'deep')];
  const preferred = new Map([[String(Date.parse(inputs[0].startTime)), ['preferred']]]);
  const days = normalizeSleep(inputs, 'healthconnect', preferred);
  expect(days[0].sourceId).toBe('preferred');
  expect(days[0].durationMinutes).toBe(480);
  expect(days[0].stages).toBeUndefined();
});

it('never counts in-bed or awake intervals as sleep or invents unknown sleep stages', () => {
  const days = normalizeSleep([interval('a', '00:00', '09:00', 'inBed'), interval('a', '01:00', '08:00'), interval('a', '03:00', '04:00', 'awake')], 'healthkit');
  expect(days[0].durationMinutes).toBe(360);
  expect(days[0].stages).toBeUndefined();
});

it('resolves overlapping stages within one source without counting a minute twice', () => {
  const days = normalizeSleep([interval('a', '00:00', '08:00'), interval('a', '00:00', '03:00', 'deep'), interval('a', '02:00', '04:00', 'rem')], 'healthkit');
  const { deepMinutes = 0, remMinutes = 0, lightMinutes = 0 } = days[0].stages!;
  expect(days[0].durationMinutes).toBe(480);
  expect(deepMinutes + remMinutes + lightMinutes).toBeLessThanOrEqual(480);
});

it('sums a separate nap and overnight sleep into one daily value', () => {
  const days = normalizeSleep([interval('a', '00:00', '08:00'), interval('b', '14:00', '15:00')], 'healthconnect');
  expect(days).toHaveLength(1);
  expect(days[0].durationMinutes).toBe(540);
  expect(days[0].sourceRecords).toHaveLength(2);
});

it('keeps non-overlapping periods from different sources even when close together', () => {
  const days = normalizeSleep([interval('a', '06:00', '07:00'), interval('b', '07:30', '08:00')], 'healthconnect');
  expect(days[0].durationMinutes).toBe(90);
});

it('omits invalid, in-bed-only and unknown-only samples', () => {
  expect(normalizeSleep([interval('a', '08:00', '01:00'), interval('a', '00:00', '08:00', 'inBed'), interval('a', '00:00', '08:00', 'unknown')], 'healthkit')).toEqual([]);
});

it('replaces earlier per-source sleep metrics while preserving manual entries and other dates', () => {
  const old: MetricEntry = { metricId: 'sleep_duration', origin: 'healthconnect', value: 480, unit: 'min', recordedAt: '2026-10-20T00:00:00Z', sourceRecordId: 'old' };
  const manual = { ...old, origin: 'manual' as const };
  const otherDay = { ...old, recordedAt: '2026-10-19T00:00:00Z' };
  const incoming: MetricEntry = { ...old, isAggregate: true, normalizationVersion: 'sleep-v1', sourceRecordId: undefined };
  expect(reconcileSyncedMetrics([old, manual, otherDay], [incoming])).toEqual([manual, otherDay]);
});

it('assigns an overnight sleep to its wake date without losing the pre-midnight stages', () => {
  const inputs: SleepInterval[] = [
    { ...interval('a', '00:00', '02:00', 'deep'), startTime: '2026-10-19T22:00:00Z', endTime: '2026-10-20T00:00:00Z' },
    interval('a', '00:00', '02:00', 'rem'), interval('a', '02:00', '06:00', 'light'),
  ];
  expect(normalizeSleep(inputs, 'healthkit')[0]).toMatchObject({ date: '2026-10-20', durationMinutes: 480, stages: { deepMinutes: 120, remMinutes: 120, lightMinutes: 240 } });
});
