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

/** Calendar week in local time, Monday through today. Missing data remains unknown. */
export function getCurrentWeekMetricTotal(entries: MetricEntry[], now = new Date()): number | undefined {
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const start = toLocalDateKey(monday);
  const today = toLocalDateKey(now);
  const currentWeek = entries.filter(entry => {
    const recordedAt = new Date(entry.recordedAt);
    if (!Number.isFinite(recordedAt.getTime()) || !Number.isFinite(entry.value) || entry.value < 0) return false;
    const date = toLocalDateKey(recordedAt);
    return date >= start && date <= today;
  });
  return currentWeek.length ? currentWeek.reduce((sum, entry) => sum + entry.value, 0) : undefined;
}
