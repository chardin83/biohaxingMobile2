import type { SampleProvenance, SourceRecord } from '@/app/context/storage/metrics/metricTypes';

const nonEmpty = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : undefined);

export function healthKitProvenance(sample: { id?: unknown; sourceId?: unknown; sourceName?: unknown }): SampleProvenance {
  return { sourceRecordId: nonEmpty(sample.id), sourceId: nonEmpty(sample.sourceId), sourceName: nonEmpty(sample.sourceName), provenanceVersion: 1 };
}

export function healthConnectProvenance(record: { metadata?: { id?: unknown; dataOrigin?: unknown } }): SampleProvenance {
  // Health Connect exposes the writing app's package ID, not a display name.
  return { sourceRecordId: nonEmpty(record.metadata?.id), sourceId: nonEmpty(record.metadata?.dataOrigin), provenanceVersion: 1 };
}

/** Keep every contributing record; never assign one provider to a mixed aggregate. */
export function aggregateProvenance(items: readonly SampleProvenance[]): SampleProvenance {
  const records: SourceRecord[] = items.flatMap(
    item => item.sourceRecords ?? [{ sourceRecordId: item.sourceRecordId, sourceId: item.sourceId, sourceName: item.sourceName }]
  );
  const unique = [...new Map(records.map(record => [JSON.stringify(record), record])).values()];
  const sourceIds = new Set(unique.map(record => record.sourceId));
  const sourceNames = new Set(unique.map(record => record.sourceName));
  return {
    sourceId: sourceIds.size === 1 ? unique[0]?.sourceId : undefined,
    sourceName: sourceNames.size === 1 ? unique[0]?.sourceName : undefined,
    sourceRecords: unique,
    isAggregate: true,
    provenanceVersion: 1,
  };
}

export function copyProvenance(item: SampleProvenance): SampleProvenance {
  return {
    sourceName: item.sourceName,
    sourceId: item.sourceId,
    sourceRecordId: item.sourceRecordId,
    sourceRecords: item.sourceRecords,
    isAggregate: item.isAggregate,
    provenanceVersion: 1,
    normalizationVersion: item.normalizationVersion,
  };
}
