import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { MetricTrendPoint } from '@/components/metrics/MetricTrendChart';
import type { MetricId } from '@/locales/metrics';

import { toLocalDateKey } from './metricDateUtils';

export type HRVMetricId = 'hrv_rmssd' | 'hrv_sdnn';

export function buildHRVDailyTrend(entries: MetricEntry[]): MetricTrendPoint[] {
  const days = new Map<string, { sum: number; count: number }>();
  for (const entry of entries) {
    const recordedAt = new Date(entry.recordedAt);
    if (!Number.isFinite(entry.value) || !Number.isFinite(recordedAt.getTime())) continue;
    const date = toLocalDateKey(recordedAt);
    const day = days.get(date) ?? { sum: 0, count: 0 };
    day.sum += entry.value;
    day.count++;
    days.set(date, day);
  }
  return Array.from(days, ([date, day]) => ({ date, value: day.sum / day.count })).sort((left, right) => left.date.localeCompare(right.date));
}

// Select one complete series so trends and deltas never compare RMSSD with SDNN.
export function getHRVHistory(getMetricHistory: (metricId: MetricId) => MetricEntry[]) {
  const rmssd = getMetricHistory('hrv_rmssd');
  const sdnn = getMetricHistory('hrv_sdnn');
  const latestRmssd = rmssd.at(-1)?.recordedAt;
  const latestSdnn = sdnn.at(-1)?.recordedAt;
  const metricId: HRVMetricId = latestSdnn && (!latestRmssd || latestSdnn > latestRmssd) ? 'hrv_sdnn' : 'hrv_rmssd';
  return { metricId, entries: metricId === 'hrv_rmssd' ? rmssd : sdnn };
}
