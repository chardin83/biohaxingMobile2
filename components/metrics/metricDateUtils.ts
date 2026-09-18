import { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

export function toLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLatestEntryForToday(entries: MetricEntry[], now = new Date()): MetricEntry | undefined {
  const latest = entries.at(-1);
  if (!latest) return undefined;
  const todayKey = toLocalDateKey(now);
  return toLocalDateKey(new Date(latest.recordedAt)) === todayKey ? latest : undefined;
}

export function getLatestMetricEntry<T>(entries: T[]): T | undefined {
  return entries.at(-1);
}
