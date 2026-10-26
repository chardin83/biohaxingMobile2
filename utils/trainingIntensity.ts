import type { TrainingIntensityInterval } from '@/types/training';

type HeartRatePoint = { time: number; value: number };

function intervalAbove(current: HeartRatePoint, next: HeartRatePoint, threshold: number): [number, number] | undefined {
  if (current.value < threshold && next.value < threshold) return undefined;
  let start = current.time;
  let end = next.time;
  if (current.value < threshold || next.value < threshold) {
    const crossing = current.time + (next.time - current.time) * (threshold - current.value) / (next.value - current.value);
    if (current.value < threshold) start = crossing;
    else end = crossing;
  }
  return end > start ? [start, end] : undefined;
}

function appendInterval(intervals: TrainingIntensityInterval[], start: number, end: number) {
  if (end > start) intervals.push({ startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString() });
}

/** Disjoint moderate/vigorous time, interpolated only across gaps of at most ten minutes. */
export function calculateWorkoutIntensity(samples: HeartRatePoint[], startTime: string, endTime: string, threshold: number, moderateThreshold?: number, highIntensityThreshold?: number) {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isFinite(threshold) || threshold <= 0) return undefined;
  const hasModerateThreshold = moderateThreshold !== undefined && Number.isFinite(moderateThreshold) && moderateThreshold > 0 && moderateThreshold < threshold;
  const hasHighIntensityThreshold = highIntensityThreshold !== undefined && Number.isFinite(highIntensityThreshold) && highIntensityThreshold > threshold;
  const points = samples.filter(point => Number.isFinite(point.time) && Number.isFinite(point.value) && point.value > 0 && point.time >= start && point.time <= end)
    .sort((a, b) => a.time - b.time);
  const intensityIntervals: TrainingIntensityInterval[] = [];
  const moderateIntervals: TrainingIntensityInterval[] = [];
  const highIntensityIntervals: TrainingIntensityInterval[] = [];
  let highIntensityMs = 0;
  let hasCoverage = false;
  let intenseMs = 0;
  let moderateMs = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const duration = next.time - current.time;
    if (duration <= 0 || duration > 10 * 60 * 1000) continue;
    hasCoverage = true;
    const vigorous = intervalAbove(current, next, threshold);
    if (vigorous) {
      intenseMs += vigorous[1] - vigorous[0];
      appendInterval(intensityIntervals, ...vigorous);
    }
    const highIntensity = hasHighIntensityThreshold ? intervalAbove(current, next, highIntensityThreshold!) : undefined;
    if (highIntensity) {
      highIntensityMs += highIntensity[1] - highIntensity[0];
      appendInterval(highIntensityIntervals, ...highIntensity);
    }
    const aboveModerate = hasModerateThreshold ? intervalAbove(current, next, moderateThreshold!) : undefined;
    if (!aboveModerate) continue;
    moderateMs += aboveModerate[1] - aboveModerate[0] - (vigorous ? vigorous[1] - vigorous[0] : 0);
    if (vigorous) {
      appendInterval(moderateIntervals, aboveModerate[0], vigorous[0]);
      appendInterval(moderateIntervals, vigorous[1], aboveModerate[1]);
    } else appendInterval(moderateIntervals, ...aboveModerate);
  }
  if (!hasCoverage) return undefined;
  return {
    intensityMinutes: intenseMs / 60000,
    intensityIntervals,
    ...(hasHighIntensityThreshold ? { highIntensityMinutes: highIntensityMs / 60000, highIntensityIntervals } : {}),
    ...(hasModerateThreshold ? { moderateMinutes: Math.max(0, moderateMs / 60000), moderateIntervals } : {}),
  };
}

/** Time-weighted mean over observed pulse intervals, excluding gaps longer than ten minutes. */
export function calculateWorkoutAverageHeartRate(samples: HeartRatePoint[], startTime: string, endTime: string): number | undefined {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined;
  const points = samples.filter(point => Number.isFinite(point.time) && Number.isFinite(point.value) && point.value > 0 && point.time >= start && point.time <= end)
    .sort((a, b) => a.time - b.time);
  let weightedHeartRate = 0;
  let observedDuration = 0;
  for (let i = 1; i < points.length; i++) {
    const duration = points[i].time - points[i - 1].time;
    if (duration <= 0 || duration > 10 * 60 * 1000) continue;
    weightedHeartRate += (points[i - 1].value + points[i].value) / 2 * duration;
    observedDuration += duration;
  }
  return observedDuration > 0 ? Math.round(weightedHeartRate / observedDuration) : undefined;
}
