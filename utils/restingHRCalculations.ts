import { HRVSummary } from '@/wearables/types';

export interface RestingHRMetrics {
  restingHR: number | null;
  restingHRDelta: number;
}

export function calculateRestingHRMetrics(hrvData: HRVSummary[]): RestingHRMetrics {
  if (hrvData.length === 0) {
    return { restingHR: null, restingHRDelta: 0 };
  }

  const latest = hrvData[hrvData.length - 1];
  const restingHR = latest.avgRestingHrBpm ?? null;

  let restingHRDelta = 0;

  if (hrvData.length >= 2) {
    const avgHR = hrvData.slice(0, -1).reduce((sum, d) => sum + (d.avgRestingHrBpm ?? 0), 0) / (hrvData.length - 1);
    restingHRDelta = latest.avgRestingHrBpm && avgHR > 0 ? Math.round(latest.avgRestingHrBpm - avgHR) : 0;
  }

  return { restingHR, restingHRDelta };
}
