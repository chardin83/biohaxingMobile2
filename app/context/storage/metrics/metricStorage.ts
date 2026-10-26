import AsyncStorage from '@react-native-async-storage/async-storage';

import { MetricId } from '@/locales/metrics';

import { getStorageSize } from '../shared/storageSize';
import { isDeletedSyncedMetric, loadDeletedMetricKeys, rememberDeletedMetric } from './deletedMetricStorage';
import { getLegacyMetricSyncKey, getMetricOrigin, getMetricSyncKey, isImportedMetric } from './metricProvenance';
import type { MetricEntry } from './metricTypes';

const METRIC_ENTRIES_NAMESPACE = 'metricEntries';

const getMetricKey = (metricId: MetricId): string => `${METRIC_ENTRIES_NAMESPACE}:${metricId}`;

const saveMetricEntries = (metricId: MetricId, entries: MetricEntry[]): Promise<void> => AsyncStorage.setItem(getMetricKey(metricId), JSON.stringify(entries));

const removeMetricEntries = (metricId: MetricId): Promise<void> => AsyncStorage.removeItem(getMetricKey(metricId));

const hasMetricEntriesChanged = (previous: MetricEntry[], updated: MetricEntry[]): boolean => {
  if (previous.length !== updated.length) {
    return true;
  }

  return previous.some((entry, index) => entry !== updated[index]);
};

export const syncMetricEntries = (previous: MetricEntry[], updated: MetricEntry[], recordDeletions = true): void => {
  const remainingKeys = new Set(updated.map(getMetricSyncKey));
  const upgradedKeys = new Set(updated.filter(entry => entry.provenanceVersion === 1).map(getLegacyMetricSyncKey));
  const deletedWrites = previous
    .filter(
      entry =>
        recordDeletions &&
        isImportedMetric(entry) &&
        !remainingKeys.has(getMetricSyncKey(entry)) &&
        !(entry.provenanceVersion !== 1 && !entry.sourceRecordId && !entry.sourceId && upgradedKeys.has(getLegacyMetricSyncKey(entry)))
    )
    .map(rememberDeletedMetric);
  const deletionsSaved = Promise.all(deletedWrites);

  const metricIds = new Set<MetricId>([...previous.map(entry => entry.metricId), ...updated.map(entry => entry.metricId)]);

  metricIds.forEach(metricId => {
    const previousEntries = previous.filter(entry => entry.metricId === metricId);

    const updatedEntries = updated.filter(entry => entry.metricId === metricId);

    if (!hasMetricEntriesChanged(previousEntries, updatedEntries)) {
      return;
    }

    if (updatedEntries.length === 0) {
      deletionsSaved
        .then(() => removeMetricEntries(metricId))
        .catch(error => {
          console.error(`Failed to remove metric ${metricId}`, error);
        });
      return;
    }

    deletionsSaved
      .then(() => saveMetricEntries(metricId, updatedEntries))
      .catch(error => {
        console.error(`Failed to save metric ${metricId}`, error);
      });
  });
};

export const getAllMetricEntries = async (): Promise<MetricEntry[]> => {
  await loadDeletedMetricKeys();
  const prefix = `${METRIC_ENTRIES_NAMESPACE}:`;
  const keys = await AsyncStorage.getAllKeys();

  const metricKeys = keys.filter(key => key.startsWith(prefix));

  if (metricKeys.length === 0) {
    return [];
  }

  const values = await AsyncStorage.multiGet(metricKeys);

  return values
    .flatMap(([, value]) => (value ? (JSON.parse(value) as MetricEntry[]) : []))
    .filter(entry => !isDeletedSyncedMetric(entry))
    .map(entry => ({ ...entry, origin: getMetricOrigin(entry) }))
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
};

export const getMetricStorageSize = (): Promise<number> => getStorageSize([METRIC_ENTRIES_NAMESPACE, 'deletedSyncedMetric']);
