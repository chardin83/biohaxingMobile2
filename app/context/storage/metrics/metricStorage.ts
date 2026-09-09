import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MetricId } from '@/locales/metrics';

export type MetricEntry = {
  metricId: MetricId;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
};

const STORAGE_KEY = 'metricEntries';

export const getMetricEntries =
  async (): Promise<MetricEntry[]> => {
    const raw =
      await AsyncStorage.getItem(STORAGE_KEY);

    return raw ? JSON.parse(raw) : [];
  };

export const saveMetricEntries = (
  entries: MetricEntry[]
) =>
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(entries)
  );