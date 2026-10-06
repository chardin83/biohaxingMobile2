import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { MetricTrendPoint } from '@/components/metrics/MetricTrendChart';

import { buildHRVDailyTrend } from './hrvHistory';
import { toLocalDateKey } from './metricDateUtils';

export type RecoveryLevel = 'wellRecovered' | 'normalRecovery' | 'reducedRecovery' | 'lowRecovery';

export const RECOVERY_THRESHOLDS = [
  { level: 'wellRecovered', minScore: 80 },
  { level: 'normalRecovery', minScore: 60 },
  { level: 'reducedRecovery', minScore: 40 },
  { level: 'lowRecovery', minScore: 0 },
] as const satisfies readonly { level: RecoveryLevel; minScore: number }[];

// A value matching the personal baseline scores 70 (normal recovery).
export function calculateRecoveryScore(restingHR: MetricEntry[], sleep: MetricEntry[], hrv: MetricEntry[]) {
  const series = [
    buildHRVDailyTrend(restingHR),
    buildHRVDailyTrend(sleep.map(entry => ({ ...entry, value: entry.unit === 'hours' ? entry.value * 60 : entry.value }))),
    buildHRVDailyTrend(hrv),
  ];
  return scoreDailySeries(series);
}

function scoreDailySeries(series: MetricTrendPoint[][]) {
  const latest = series.map(points => points.at(-1));
  if (latest.some(point => !point || point.value <= 0)) return null;
  const date = latest[0]!.date;
  // Do not combine current values from different days.
  if (latest.some(point => point!.date !== date)) return null;
  const start = new Date(`${date}T12:00:00`);
  start.setDate(start.getDate() - 28);
  const startKey = toLocalDateKey(start);
  const baselines = series.map(points => {
    const days = points.filter(point => point.date >= startKey && point.date < date && point.value > 0);
    return days.length ? days.reduce((sum, point) => sum + point.value, 0) / days.length : null;
  });
  if (baselines.some(value => value === null)) return null;
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  const restingScore = clamp((70 * baselines[0]!) / latest[0]!.value);
  const sleepScore = clamp((70 * latest[1]!.value) / baselines[1]!);
  const hrvScore = clamp((70 * latest[2]!.value) / baselines[2]!);
  return Math.round(restingScore * 0.3 + sleepScore * 0.25 + hrvScore * 0.45);
}

export function buildRecoveryTrend(restingHR: MetricEntry[], sleep: MetricEntry[], hrv: MetricEntry[]): MetricTrendPoint[] {
  const series = [
    buildHRVDailyTrend(restingHR),
    buildHRVDailyTrend(sleep.map(entry => ({ ...entry, value: entry.unit === 'hours' ? entry.value * 60 : entry.value }))),
    buildHRVDailyTrend(hrv),
  ];
  return series[0].flatMap(point => {
    const start = new Date(`${point.date}T12:00:00`);
    start.setDate(start.getDate() - 28);
    const startKey = toLocalDateKey(start);
    const score = scoreDailySeries(series.map(points => points.filter(day => day.date >= startKey && day.date <= point.date)));
    return score === null ? [] : [{ date: point.date, value: score }];
  });
}

export function getRecoveryLevel(score: number): RecoveryLevel {
  return RECOVERY_THRESHOLDS.find(threshold => score >= threshold.minScore)?.level ?? 'lowRecovery';
}
