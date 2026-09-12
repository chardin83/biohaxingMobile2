import { MetricId } from '@/locales/metrics';

export type MetricEntry = {
  metricId: MetricId;
  value: number;
  unit: string;
  recordedAt: string;
  notes?: string;
};