import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { DailyTrainingTracking, TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';
import { VIGOROUS_MINUTE_WEIGHT } from '@/constants/TrainingIntensity';

import { resolveTrainingEntryIntensity } from './trainingIntensity';

/** Count overlapping imported sessions once; manual entries have duration only. */
function activeMinutesForEntries(entries: TrainingLogEntry[]): number | undefined {
  const valid = entries.filter(entry => Number.isFinite(entry.durationMinutes) && entry.durationMinutes > 0);
  if (!valid.length) return undefined;
  const intervals: [number, number][] = [];
  let minutes = 0;
  for (const entry of valid) {
    const start = Date.parse(entry.startTime ?? '');
    const end = Date.parse(entry.endTime ?? '');
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) intervals.push([start, end]);
    else minutes += entry.durationMinutes;
  }
  intervals.sort((a, b) => a[0] - b[0]);
  let previousEnd = -Infinity;
  for (const [start, end] of intervals) {
    minutes += Math.max(0, end - Math.max(start, previousEnd)) / 60000;
    previousEnd = Math.max(previousEnd, end);
  }
  return minutes;
}

export function buildActiveMinutesMetrics(tracking: DailyTrainingTracking): MetricEntry[] {
  return Object.entries(tracking).flatMap(([date, entries]) => {
    const minutes = activeMinutesForEntries(entries);
    return minutes === undefined ? [] : [{ metricId: 'active_minutes' as const, value: Math.round(minutes), unit: 'min', recordedAt: `${date}T00:00:00`, origin: 'training' as const }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

type Interval = [number, number];

function mergedIntervals(intervals: Interval[]): Interval[] {
  const merged: Interval[] = [];
  intervals.sort((a, b) => a[0] - b[0]);
  for (const [start, end] of intervals) {
    const last = merged.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

function intervalMinutes(intervals: Interval[]) {
  return intervals.reduce((sum, [start, end]) => sum + (end - start) / 60000, 0);
}

const INTENSITY_INTERVAL_KEYS = {
  moderateMinutes: 'moderateIntervals',
  intensityMinutes: 'intensityIntervals',
  highIntensityMinutes: 'highIntensityIntervals',
  lowIntensityMinutes: 'lowIntensityIntervals',
} as const;

function measuredTime(entries: TrainingLogEntry[], key: keyof typeof INTENSITY_INTERVAL_KEYS) {
  const intervals: Interval[] = [];
  let withoutIntervals = 0;
  let hasData = false;
  for (const original of entries) {
    const entry = resolveTrainingEntryIntensity(original);
    const minutes = entry[key];
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0 || !Number.isFinite(entry.durationMinutes) || entry.durationMinutes <= 0) continue;
    hasData = true;
    const measuredIntervals = entry[INTENSITY_INTERVAL_KEYS[key]];
    if (!measuredIntervals) {
      withoutIntervals += Math.min(minutes, entry.durationMinutes);
      continue;
    }
    for (const interval of measuredIntervals) {
      const start = Date.parse(interval.startTime);
      const end = Date.parse(interval.endTime);
      if (Number.isFinite(start) && Number.isFinite(end) && end > start) intervals.push([start, end]);
    }
  }
  return { intervals: mergedIntervals(intervals), withoutIntervals, hasData };
}

function summarizeIntensity(entries: TrainingLogEntry[]) {
  const moderate = measuredTime(entries, 'moderateMinutes');
  const vigorous = measuredTime(entries, 'intensityMinutes');
  // If overlapping sessions classify the same time differently, vigorous takes precedence.
  let overlap = 0;
  let vigorousIndex = 0;
  for (const [start, end] of moderate.intervals) {
    while (vigorousIndex < vigorous.intervals.length && vigorous.intervals[vigorousIndex][1] <= start) vigorousIndex++;
    for (let i = vigorousIndex; i < vigorous.intervals.length && vigorous.intervals[i][0] < end; i++) {
      overlap += Math.max(0, Math.min(end, vigorous.intervals[i][1]) - Math.max(start, vigorous.intervals[i][0])) / 60000;
    }
  }
  return {
    moderateMinutes: Math.max(0, intervalMinutes(moderate.intervals) - overlap) + moderate.withoutIntervals,
    intensityMinutes: intervalMinutes(vigorous.intervals) + vigorous.withoutIntervals,
    hasModerate: moderate.hasData,
    hasVigorous: vigorous.hasData,
  };
}

function buildIntensityMetric(tracking: DailyTrainingTracking, metricId: 'intensity_minutes' | 'moderate_minutes' | 'weighted_training_minutes'): MetricEntry[] {
  return Object.entries(tracking).flatMap(([date, entries]) => {
    // Weighted activity requires both moderate and vigorous data.
    const classified = entries.map(resolveTrainingEntryIntensity);
    const measured = metricId === 'weighted_training_minutes'
      ? classified.filter(entry => Number.isFinite(entry.moderateMinutes) && Number.isFinite(entry.intensityMinutes))
      : classified;
    const summary = summarizeIntensity(measured);
    const result = {
      moderate_minutes: { hasData: summary.hasModerate, value: summary.moderateMinutes },
      intensity_minutes: { hasData: summary.hasVigorous, value: summary.intensityMinutes },
      weighted_training_minutes: {
        hasData: summary.hasModerate && summary.hasVigorous,
        value: summary.moderateMinutes + summary.intensityMinutes * VIGOROUS_MINUTE_WEIGHT,
      },
    }[metricId];
    if (!result.hasData) return [];
    const value = result.value;
    return [{ metricId, value: Math.round(value), unit: 'min', recordedAt: `${date}T00:00:00`, origin: 'training' as const }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export const buildIntensityMinutesMetrics = (tracking: DailyTrainingTracking) => buildIntensityMetric(tracking, 'intensity_minutes');
export const buildModerateMinutesMetrics = (tracking: DailyTrainingTracking) => buildIntensityMetric(tracking, 'moderate_minutes');
export const buildWeightedTrainingMinutesMetrics = (tracking: DailyTrainingTracking) => buildIntensityMetric(tracking, 'weighted_training_minutes');


/** A subset of vigorous minutes; it must never add a third weighting to WHO totals. */
export function buildHighIntensityMinutesMetrics(tracking: DailyTrainingTracking): MetricEntry[] {
  return Object.entries(tracking).flatMap(([date, entries]) => {
    const measured = measuredTime(entries, 'highIntensityMinutes');
    if (!measured.hasData) return [];
    return [{
      metricId: 'high_intensity_minutes' as const,
      value: Math.round(intervalMinutes(measured.intervals) + measured.withoutIntervals),
      unit: 'min', recordedAt: `${date}T00:00:00`, origin: 'training' as const,
    }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}


/** Four disjoint display bands; the underlying vigorous metric still includes high intensity. */
export function summarizeTrainingDay(originalEntries: TrainingLogEntry[]) {
  const entries = originalEntries.map(resolveTrainingEntryIntensity);
  const activeMinutes = activeMinutesForEntries(entries) ?? 0;
  const summary = summarizeIntensity(entries);
  const splitEntries = entries.filter(entry => Number.isFinite(entry.intensityMinutes) && Number.isFinite(entry.highIntensityMinutes));
  const vigorous = measuredTime(splitEntries, 'intensityMinutes');
  const high = measuredTime(splitEntries, 'highIntensityMinutes');
  const highIntensityMinutes = high.hasData ? Math.min(activeMinutes, intervalMinutes(high.intervals) + high.withoutIntervals) : undefined;
  const intenseMinutes = vigorous.hasData && highIntensityMinutes !== undefined
    ? Math.min(activeMinutes - highIntensityMinutes, Math.max(0, intervalMinutes(vigorous.intervals) + vigorous.withoutIntervals - highIntensityMinutes))
    : undefined;
  const moderateMinutes = summary.hasModerate
    ? Math.min(summary.moderateMinutes, Math.max(0, activeMinutes - (highIntensityMinutes ?? 0) - (intenseMinutes ?? 0)))
    : undefined;
  const low = measuredTime(entries.filter(entry => entry.activityType !== 'gym' || ((entry.origin === undefined || entry.origin === 'manual') && entry.intensity !== undefined)), 'lowIntensityMinutes');
  const lowIntensityMinutes = low.hasData
    ? Math.min(intervalMinutes(low.intervals) + low.withoutIntervals, Math.max(0, activeMinutes - (moderateMinutes ?? 0) - (intenseMinutes ?? 0) - (highIntensityMinutes ?? 0)))
    : undefined;
  const classifiedMinutes = (lowIntensityMinutes ?? 0) + (moderateMinutes ?? 0) + (intenseMinutes ?? 0) + (highIntensityMinutes ?? 0);
  const distances = entries.map(entry => entry.distanceKm).filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);
  return {
    activeMinutes, sessionCount: entries.length,
    distanceKm: distances.length ? distances.reduce((total, value) => total + value, 0) : undefined,
    moderateMinutes, intenseMinutes, highIntensityMinutes, lowIntensityMinutes, classifiedMinutes,
  };
}
