import { type MetricEntry } from '@/app/context/StorageContext';

export function toLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLatestEntryForToday(entries: MetricEntry[], now = new Date()) {
  const todayKey = toLocalDateKey(now);

  return entries
    .filter(entry => toLocalDateKey(new Date(entry.recordedAt)) === todayKey)
    .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
    .at(-1);
}
