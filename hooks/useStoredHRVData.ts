import React from 'react';

import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { useStorage } from '@/app/context/StorageContext';
import { HRVSummary } from '@/wearables/types';

function buildHRVSummariesFromEntries(entries: MetricEntry[]): HRVSummary[] {
  const byDate = new Map<string, HRVSummary>();

  const sortedEntries = [...entries].sort((left, right) => left.recordedAt.localeCompare(right.recordedAt));

  for (const entry of sortedEntries) {
    const date = entry.recordedAt.slice(0, 10);
    const summary: HRVSummary = byDate.get(date) ?? { source: 'mock', date };

    if (entry.metricId === 'hrv_rmssd') {
      summary.rmssdMs = entry.value;
    }

    if (entry.metricId === 'hrv_sdnn') {
      summary.sdnnMs = entry.value;
    }

    byDate.set(date, summary);
  }

  return Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date));
}

export function useStoredHRVData(): HRVSummary[] {
  const { getMetricHistory } = useStorage();

  return React.useMemo(() => {
    const hrvEntries = [...getMetricHistory('hrv_rmssd'), ...getMetricHistory('hrv_sdnn')];

    return buildHRVSummariesFromEntries(hrvEntries);
  }, [getMetricHistory]);
}
