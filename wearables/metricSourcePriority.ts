import { getMetricOrigin } from '@/app/context/storage/metrics/metricProvenance';
import type { MetricEntry, SampleProvenance } from '@/app/context/storage/metrics/metricTypes';
import { METRIC_SOURCE_PRIORITIES, type MetricSourceFamily } from '@/constants/MetricSourcePriority';
import type { MetricId } from '@/locales/metrics';

const PATTERNS: Record<MetricSourceFamily, RegExp> = {
  oura: /\boura(?:ring)?\b/i,
  apple: /\bapple\b/i,
  garmin: /\bgarmin\b/i,
  samsung: /\bsamsung\b|\bsec\.android\b/i,
  fitbit: /\bfitbit\b/i,
  polar: /\bpolar\b/i,
  whoop: /\bwhoop\b/i,
  omron: /\bomron\b/i,
  withings: /\bwithings\b/i,
  // Verified store IDs and published app name; see docs/metric-source-identifiers.md.
  hume: /^(?:com\.elink\.fittrackhealth(?:\.pro)?|hume health)$/i,
};

export function metricSourceKey(item: SampleProvenance) {
  return item.sourceId ?? item.sourceName ?? 'unknown';
}

export function metricSourceRank(metricId: MetricId, item: SampleProvenance) {
  const priority = METRIC_SOURCE_PRIORITIES[metricId] ?? [];
  // Match original metadata only; HealthKit/Health Connect do not identify a device brand.
  const sourceId = item.sourceId?.trim().toLowerCase() ?? '';
  const index = priority.findIndex(family => PATTERNS[family].test(sourceId) || PATTERNS[family].test(item.sourceName?.trim() ?? ''));
  return index >= 0 ? index : priority.length;
}

export function selectMetricSource<T extends SampleProvenance>(items: readonly T[], metricId: MetricId): T[] {
  if (!items.length) return [];
  const first = [...items].sort(
    (a, b) => metricSourceRank(metricId, a) - metricSourceRank(metricId, b) || metricSourceKey(a).localeCompare(metricSourceKey(b))
  )[0];
  const key = metricSourceKey(first);
  return items.filter(item => metricSourceKey(item) === key);
}

export function selectMetricSourcesByDay<T extends SampleProvenance & { date: string }>(items: readonly T[], metricId: MetricId): T[] {
  const days = new Map<string, T[]>();
  for (const item of items) days.set(item.date, [...(days.get(item.date) ?? []), item]);
  return [...days.keys()].sort().flatMap(date => selectMetricSource(days.get(date)!, metricId));
}

/** Keep every sample from the selected original source, rather than averaging different devices. */
export function prioritizeSyncedMetrics(entries: MetricEntry[]) {
  const groups = new Map<string, MetricEntry[]>();
  for (const entry of entries.filter(item => Number.isFinite(item.value) && Number.isFinite(Date.parse(item.recordedAt)))) {
    const key = `${getMetricOrigin(entry)}|${entry.metricId}|${entry.recordedAt.slice(0, 10)}`;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups.values()].flatMap(group => {
    if (!METRIC_SOURCE_PRIORITIES[group[0].metricId] || group[0].normalizationVersion === 'sleep-v1') return group;
    return selectMetricSource(group, group[0].metricId);
  });
}
