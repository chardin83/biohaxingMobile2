import { MetricId } from '@/locales/metrics';

export type SourceRecord = { sourceRecordId?: string; sourceId?: string; sourceName?: string };
export type SampleProvenance = SourceRecord & {
  sourceRecords?: SourceRecord[];
  isAggregate?: boolean;
  provenanceVersion?: 1;
  normalizationVersion?: 'sleep-v1';
};

export type MetricEntry = SampleProvenance & {
  metricId: MetricId;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
  origin?: 'manual' | 'healthkit' | 'healthconnect' | 'garmin' | 'fitbit' | 'mock' | 'none' | 'nutrition' | 'calculated';
};