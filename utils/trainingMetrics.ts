import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { DailyTrainingTracking, TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';
import { VIGOROUS_MINUTE_WEIGHT } from '@/constants/TrainingIntensity';

/** Count overlapping imported sessions once; manual entries have duration only. */
export function buildActiveMinutesMetrics(tracking: DailyTrainingTracking): MetricEntry[] {
  return Object.entries(tracking).flatMap(([date, entries]) => {
    const valid = entries.filter(entry => Number.isFinite(entry.durationMinutes) && entry.durationMinutes > 0);
    if (!valid.length) return [];
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
    return [{ metricId: 'active_minutes' as const, value: Math.round(minutes), unit: 'min', recordedAt: `${date}T00:00:00`, origin: 'training' as const }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

type Interval = [number, number];

function mergedIntervals(intervals: Interval[]): Interval[] {
  const merged: Interval[] = [];
  for (const [start, end] of intervals.sort((a, b) => a[0] - b[0])) {
    const last = merged.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

function intervalMinutes(intervals: Interval[]) {
  return intervals.reduce((sum, [start, end]) => sum + (end - start) / 60000, 0);
}

function measuredTime(entries: TrainingLogEntry[], key: 'moderateMinutes' | 'intensityMinutes') {
  const intervals: Interval[] = [];
  let withoutIntervals = 0;
  let hasData = false;
  for (const entry of entries) {
    const minutes = entry[key];
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 0 || !Number.isFinite(entry.durationMinutes) || entry.durationMinutes <= 0) continue;
    hasData = true;
    const measuredIntervals = key === 'moderateMinutes' ? entry.moderateIntervals : entry.intensityIntervals;
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
    // Older vigorous-only records cannot establish moderate or weighted activity.
    const measured = metricId === 'weighted_training_minutes'
      ? entries.filter(entry => Number.isFinite(entry.moderateMinutes) && Number.isFinite(entry.intensityMinutes))
      : entries;
    const summary = summarizeIntensity(measured);
    if (metricId === 'moderate_minutes' ? !summary.hasModerate : metricId === 'intensity_minutes' ? !summary.hasVigorous : !summary.hasModerate || !summary.hasVigorous) return [];
    const value = metricId === 'moderate_minutes' ? summary.moderateMinutes
      : metricId === 'intensity_minutes' ? summary.intensityMinutes
        : summary.moderateMinutes + summary.intensityMinutes * VIGOROUS_MINUTE_WEIGHT;
    return [{ metricId, value: Math.round(value), unit: 'min', recordedAt: `${date}T00:00:00`, origin: 'training' as const }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export const buildIntensityMinutesMetrics = (tracking: DailyTrainingTracking) => buildIntensityMetric(tracking, 'intensity_minutes');
export const buildModerateMinutesMetrics = (tracking: DailyTrainingTracking) => buildIntensityMetric(tracking, 'moderate_minutes');
export const buildWeightedTrainingMinutesMetrics = (tracking: DailyTrainingTracking) => buildIntensityMetric(tracking, 'weighted_training_minutes');
