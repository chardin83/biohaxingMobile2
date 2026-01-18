import { HRVSummary } from '@/wearables/types';

export interface HRVMetrics {
  hrv: number | null;
  hrvDelta: number;
}

export function calculateHRVMetrics(hrvData: HRVSummary[]): HRVMetrics {
  if (hrvData.length === 0) {
    return { hrv: null, hrvDelta: 0 };
  }

  const latest = hrvData[hrvData.length - 1];
  const hrv = latest.rmssdMs ?? null;

  let hrvDelta = 0;

  if (hrvData.length >= 2) {
    const avg7d = hrvData.slice(0, -1).reduce((sum, d) => sum + (d.rmssdMs ?? 0), 0) / (hrvData.length - 1);
    hrvDelta = latest.rmssdMs && avg7d > 0 ? Math.round(((latest.rmssdMs - avg7d) / avg7d) * 100) : 0;
  }

  return { hrv, hrvDelta };
}
