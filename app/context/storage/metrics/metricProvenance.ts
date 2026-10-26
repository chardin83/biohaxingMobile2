import type { MetricEntry } from './metricTypes';

export function getMetricOrigin(entry: MetricEntry): NonNullable<MetricEntry['origin']> {
  if (entry.origin) return entry.origin;
  if (entry.metricId === 'glycemic_index' || entry.metricId === 'calories') return 'nutrition';
  if (entry.metricId === 'recovery_status') return 'calculated';
  // Older imports stored their provider only in notes.
  if (/^AppleHealth(?:\b|\s|\()/.test(entry.notes ?? '')) return 'healthkit';
  if (/^HealthConnect(?:\b|\s|\()/.test(entry.notes ?? '')) return 'healthconnect';
  return 'manual';
}

export function isImportedMetric(entry: MetricEntry) {
  return !['manual', 'nutrition', 'training', 'calculated'].includes(getMetricOrigin(entry));
}

export function canEditMetric(entry: MetricEntry) {
  return getMetricOrigin(entry) === 'manual';
}

export function getLegacyMetricSyncKey(entry: MetricEntry) {
  const timestamp = new Date(entry.recordedAt).getTime();
  return JSON.stringify([getMetricOrigin(entry), entry.metricId, Number.isFinite(timestamp) ? timestamp : entry.recordedAt]);
}

export function getMetricSyncKey(entry: MetricEntry) {
  if (!entry.isAggregate && entry.sourceRecordId) {
    return JSON.stringify([getMetricOrigin(entry), entry.metricId, 'record', entry.sourceRecordId]);
  }
  const sourceIdentity = entry.sourceId ?? (entry.provenanceVersion === 1 ? entry.sourceName : undefined);
  if (!entry.isAggregate && sourceIdentity) {
    return JSON.stringify([getMetricOrigin(entry), entry.metricId, 'source', sourceIdentity, new Date(entry.recordedAt).getTime()]);
  }
  return getLegacyMetricSyncKey(entry);
}

export function isLegacyMetricUpgrade(previous: MetricEntry, incoming: MetricEntry) {
  return (
    previous.provenanceVersion !== 1 &&
    !previous.sourceRecordId &&
    !previous.sourceId &&
    incoming.provenanceVersion === 1 &&
    getLegacyMetricSyncKey(previous) === getLegacyMetricSyncKey(incoming)
  );
}

/** Allow deletion, but preserve imported values during local edits. */
export function protectImportedMetrics(previous: MetricEntry[], proposed: MetricEntry[]) {
  const locked = new Map(previous.filter(entry => !canEditMetric(entry)).map(entry => [getMetricSyncKey(entry), entry]));
  return proposed.map(entry => locked.get(getMetricSyncKey(entry)) ?? { ...entry, origin: getMetricOrigin(entry) });
}
