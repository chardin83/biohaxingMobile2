import AsyncStorage from '@react-native-async-storage/async-storage';

import { MetricId } from '@/locales/metrics';

import { getStorageSize } from '../shared/storageSize';
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

export const syncMetricEntries = (previous: MetricEntry[], updated: MetricEntry[]): void => {
  const metricIds = new Set<MetricId>([...previous.map(entry => entry.metricId), ...updated.map(entry => entry.metricId)]);

  metricIds.forEach(metricId => {
    const previousEntries = previous.filter(entry => entry.metricId === metricId);

    const updatedEntries = updated.filter(entry => entry.metricId === metricId);

    if (!hasMetricEntriesChanged(previousEntries, updatedEntries)) {
      return;
    }

    if (updatedEntries.length === 0) {
      removeMetricEntries(metricId).catch(error => {
        console.error(`Failed to remove metric ${metricId}`, error);
      });
      return;
    }

    saveMetricEntries(metricId, updatedEntries).catch(error => {
      console.error(`Failed to save metric ${metricId}`, error);
    });
  });
};

export const getAllMetricEntries = async (): Promise<MetricEntry[]> => {
  const prefix = `${METRIC_ENTRIES_NAMESPACE}:`;
  const keys = await AsyncStorage.getAllKeys();

  const metricKeys = keys.filter(key => key.startsWith(prefix));

  if (metricKeys.length === 0) {
    return [];
  }

  const values = await AsyncStorage.multiGet(metricKeys);

  return values
    .flatMap(([, value]) => (value ? (JSON.parse(value) as MetricEntry[]) : []))
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
};

export const getMetricStorageSize = (): Promise<number> => getStorageSize([METRIC_ENTRIES_NAMESPACE]);
