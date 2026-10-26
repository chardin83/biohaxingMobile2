import AsyncStorage from '@react-native-async-storage/async-storage';

import { isDeletedSyncedMetric, loadDeletedMetricKeys, rememberDeletedMetric } from '../deletedMetricStorage';
import { canEditMetric, getMetricOrigin, getMetricSyncKey, isLegacyMetricUpgrade, protectImportedMetrics } from '../metricProvenance';
import { getAllMetricEntries, syncMetricEntries } from '../metricStorage';
import type { MetricEntry } from '../metricTypes';

const health: MetricEntry = { metricId: 'hrv_rmssd', value: 42, unit: 'ms', recordedAt: '2026-10-26T12:00:00Z', origin: 'healthkit' };

it('recognizes legacy Health entries and leaves manual values editable', () => {
  expect(getMetricOrigin({ ...health, origin: undefined, notes: 'AppleHealth (Watch)' })).toBe('healthkit');
  expect(canEditMetric({ ...health, origin: undefined, notes: 'HealthConnect (Garmin)' })).toBe(false);
  expect(canEditMetric({ ...health, origin: undefined })).toBe(true);
});

it('protects imported values from edits while permitting deletion', () => {
  expect(protectImportedMetrics([health], [{ ...health, value: 100 }])).toEqual([health]);
  expect(protectImportedMetrics([health], [])).toEqual([]);
});

it('uses provider and normalized timestamp to identify a sync record independently of value', () => {
  expect(getMetricSyncKey(health)).toBe(getMetricSyncKey({ ...health, value: 50, recordedAt: '2026-10-26T14:00:00+02:00' }));
  expect(getMetricSyncKey(health)).not.toBe(getMetricSyncKey({ ...health, origin: 'manual' }));
});

it('persists deletions and filters deleted Health records from stored history', async () => {
  await rememberDeletedMetric(health);
  expect(isDeletedSyncedMetric({ ...health, value: 55 })).toBe(true);
  const keys = await AsyncStorage.getAllKeys();
  expect(keys.some(key => key.startsWith('deletedSyncedMetric:'))).toBe(true);
  await AsyncStorage.setItem('metricEntries:hrv_rmssd', JSON.stringify([health, { ...health, origin: 'manual' }]));
  await loadDeletedMetricKeys();
  const entries = await getAllMetricEntries();
  expect(entries.filter(entry => entry.metricId === 'hrv_rmssd')).toEqual([{ ...health, origin: 'manual' }]);
});

it('records a deletion when an imported entry is removed through the standard storage update', async () => {
  const entry = { ...health, recordedAt: '2026-10-25T12:00:00Z' };
  syncMetricEntries([entry], []);
  expect(isDeletedSyncedMetric(entry)).toBe(true);
});

it('loads a suppression record persisted by an earlier app session', async () => {
  const entry = { ...health, recordedAt: '2026-10-20T12:00:00Z' };
  await AsyncStorage.setItem(`deletedSyncedMetric:${getMetricSyncKey(entry)}`, '1');
  await loadDeletedMetricKeys();
  expect(isDeletedSyncedMetric(entry)).toBe(true);
});

it('upgrades legacy metadata without treating the same record as a deletion', () => {
  const modern = { ...health, sourceId: 'app', sourceRecordId: 'uuid', provenanceVersion: 1 as const };
  expect(isLegacyMetricUpgrade(health, modern)).toBe(true);
  // A unique date avoids suppression from another test.
  const old = { ...health, recordedAt: '2026-10-18T12:00:00Z' };
  const upgraded = { ...modern, sourceRecordId: 'upgrade-uuid', recordedAt: old.recordedAt };
  syncMetricEntries([old], [upgraded]);
  expect(isDeletedSyncedMetric(upgraded)).toBe(false);
});

it('identifies an original record by ID even when its timestamp or source display metadata changes', () => {
  const original = { ...health, sourceRecordId: 'stable-uuid', sourceId: 'app', sourceName: 'Old name' };
  expect(getMetricSyncKey(original)).toBe(getMetricSyncKey({ ...original, recordedAt: '2026-10-26T14:00:00Z', sourceId: undefined, sourceName: 'New name' }));
});

it('does not reintroduce a deleted raw sleep value through a normalized day', async () => {
  const original: MetricEntry = { metricId: 'deep_sleep', origin: 'healthconnect', sourceId: 'sleep-app', sourceRecordId: 'deleted-sleep', unit: 'min', value: 60, recordedAt: '2026-10-15T00:00:00Z' };
  await rememberDeletedMetric(original);
  const normalized: MetricEntry = { ...original, sourceRecordId: undefined, isAggregate: true, normalizationVersion: 'sleep-v1', sourceRecords: [{ sourceId: original.sourceId, sourceRecordId: original.sourceRecordId }] };
  expect(isDeletedSyncedMetric(normalized)).toBe(true);
});

it('does not treat sync reconciliation as a user deletion', () => {
  const previous = { ...health, metricId: 'sleep_duration' as const, unit: 'min', recordedAt: '2026-10-14T00:00:00Z', sourceRecordId: 'reconciled-sleep' };
  syncMetricEntries([previous], [], false);
  expect(isDeletedSyncedMetric(previous)).toBe(false);
});
