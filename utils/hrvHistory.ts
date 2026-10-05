import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { MetricId } from '@/locales/metrics';

export type HRVMetricId = 'hrv_rmssd' | 'hrv_sdnn';

// Select one complete series so trends and deltas never compare RMSSD with SDNN.
export function getHRVHistory(getMetricHistory: (metricId: MetricId) => MetricEntry[]) {
  const rmssd = getMetricHistory('hrv_rmssd');
  const sdnn = getMetricHistory('hrv_sdnn');
  const latestRmssd = rmssd.at(-1)?.recordedAt;
  const latestSdnn = sdnn.at(-1)?.recordedAt;
  const metricId: HRVMetricId = latestSdnn && (!latestRmssd || latestSdnn > latestRmssd) ? 'hrv_sdnn' : 'hrv_rmssd';
  return { metricId, entries: metricId === 'hrv_rmssd' ? rmssd : sdnn };
}
