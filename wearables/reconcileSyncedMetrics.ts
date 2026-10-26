import { getMetricOrigin } from '@/app/context/storage/metrics/metricProvenance';
import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { METRIC_SOURCE_PRIORITIES } from '@/constants/MetricSourcePriority';

const SLEEP_METRICS = new Set(['sleep_duration', 'deep_sleep', 'rem_sleep', 'sleep_bedtime']);

/** Replace prior source selections in refreshed metric/day buckets; retain manual entries. */
export function reconcileSyncedMetrics(previous: MetricEntry[], incoming: MetricEntry[]) {
  const replacedDays = new Set(
    incoming.filter(entry => entry.normalizationVersion === 'sleep-v1').map(entry => `${getMetricOrigin(entry)}|${entry.recordedAt.slice(0, 10)}`)
  );
  const preferredDays = new Set(
    incoming
      .filter(entry => METRIC_SOURCE_PRIORITIES[entry.metricId] && entry.normalizationVersion !== 'sleep-v1')
      .map(entry => `${getMetricOrigin(entry)}|${entry.metricId}|${entry.recordedAt.slice(0, 10)}`)
  );
  return previous.filter(
    entry =>
      !(SLEEP_METRICS.has(entry.metricId) && replacedDays.has(`${getMetricOrigin(entry)}|${entry.recordedAt.slice(0, 10)}`)) &&
      !preferredDays.has(`${getMetricOrigin(entry)}|${entry.metricId}|${entry.recordedAt.slice(0, 10)}`)
  );
}
