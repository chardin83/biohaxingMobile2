import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { MetricId } from '@/locales/metrics';

import { formatDate, toDateKey } from './dateUtils';
import { translateMetricUnit } from './translateMetricUnit';

export function getLatestMetricEntries(entries: MetricEntry[], now = new Date()): Partial<Record<MetricId, MetricEntry>> {
  const result: Partial<Record<MetricId, MetricEntry>> = {};
  for (const entry of entries) {
    const time = new Date(entry.recordedAt).getTime();
    if (!Number.isFinite(time) || !Number.isFinite(entry.value) || time > now.getTime()) continue;
    const previous = result[entry.metricId];
    if (!previous || time >= new Date(previous.recordedAt).getTime()) result[entry.metricId] = entry;
  }
  return result;
}

export function formatLatestMetricValue(entry: MetricEntry, language: string, t: (key: string, options?: Record<string, unknown>) => string, now = new Date()): string {
  let value: string;
  if (entry.unit === 'min_from_midnight') {
    const minutes = ((Math.round(entry.value) % 1440) + 1440) % 1440;
    value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  } else {
    const number = new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(entry.value);
    if (entry.unit === 'score_0_100') value = `${number}/100`;
    else if (entry.unit === 'score_0_10') value = `${number}/10`;
    else value = `${number} ${translateMetricUnit(entry.unit, t, 'metrics:units')}`.trim();
  }
  return toDateKey(new Date(entry.recordedAt)) === toDateKey(now)
    ? value
    : `${value} (${formatDate(entry.recordedAt, language)})`;
}
