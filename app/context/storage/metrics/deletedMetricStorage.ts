import AsyncStorage from '@react-native-async-storage/async-storage';

import { getLegacyMetricSyncKey, getMetricSyncKey } from './metricProvenance';
import type { MetricEntry } from './metricTypes';

const PREFIX = 'deletedSyncedMetric:';
const deleted = new Set<string>();

export async function loadDeletedMetricKeys() {
  const keys = await AsyncStorage.getAllKeys();
  keys.filter(key => key.startsWith(PREFIX)).forEach(key => deleted.add(key.slice(PREFIX.length)));
}

export function isDeletedSyncedMetric(entry: MetricEntry) {
  if (deleted.has(getMetricSyncKey(entry)) || deleted.has(getLegacyMetricSyncKey(entry))) return true;
  // A newly normalized day must not reintroduce a previously deleted raw sleep value.
  return (
    entry.normalizationVersion === 'sleep-v1' &&
    (entry.sourceRecords ?? []).some(record => deleted.has(getMetricSyncKey({ ...entry, ...record, isAggregate: false, sourceRecords: undefined })))
  );
}

export function rememberDeletedMetric(entry: MetricEntry) {
  const key = getMetricSyncKey(entry);
  deleted.add(key);
  return AsyncStorage.setItem(`${PREFIX}${key}`, '1');
}
