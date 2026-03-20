import { MetricTrendPoint } from '@/components/metrics/MetricTrendChart';

/**
 * Bygger trenddata för valfritt metricId, grupperat per dag.
 * @param entries Array av metric-entries (från getMetricHistory)
 * @param transformValue (valfri) funktion för att transformera värdet
 */
export function buildTrendData(
  entries: { recordedAt: string; value: number; unit: string }[],
  transformValue?: (value: number, unit: string) => number
): MetricTrendPoint[] {
  const byDate = new Map<string, MetricTrendPoint>();

  entries
    .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
    .forEach(entry => {
      byDate.set(entry.recordedAt.slice(0, 10), {
        date: entry.recordedAt.slice(0, 10),
        value: transformValue ? transformValue(entry.value, entry.unit) : entry.value,
      });
    });

  return Array.from(byDate.values()).sort((left, right) => left.date.localeCompare(right.date));
}
