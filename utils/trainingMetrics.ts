import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { DailyTrainingTracking } from '@/app/context/storage/training/trainingTypes';

/** Count overlapping imported sessions once; manual entries have duration only. */
export function buildActiveMinutesMetrics(tracking: DailyTrainingTracking): MetricEntry[] {
  return Object.entries(tracking).flatMap(([date, entries]) => {
    const valid = entries.filter(entry => Number.isFinite(entry.durationMinutes) && entry.durationMinutes > 0);
    if (!valid.length) return [];
    const intervals: [number, number][] = [];
    let minutes = 0;
    for (const entry of valid) {
      const start = Date.parse(entry.startTime ?? '');
      const end = Date.parse(entry.endTime ?? '');
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) intervals.push([start, end]);
      else minutes += entry.durationMinutes;
    }
    intervals.sort((a, b) => a[0] - b[0]);
    let previousEnd = -Infinity;
    for (const [start, end] of intervals) {
      minutes += Math.max(0, end - Math.max(start, previousEnd)) / 60000;
      previousEnd = Math.max(previousEnd, end);
    }
    return [{ metricId: 'active_minutes' as const, value: Math.round(minutes), unit: 'min', recordedAt: `${date}T00:00:00`, origin: 'training' as const }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}
