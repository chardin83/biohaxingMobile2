import type { TrainingIntensityInterval } from '@/types/training';

type HeartRatePoint = { time: number; value: number };

/** Interpolate threshold crossings; do not infer activity across gaps longer than ten minutes. */
export function calculateWorkoutIntensity(samples: HeartRatePoint[], startTime: string, endTime: string, threshold: number) {
  const start = Date.parse(startTime);
  const end = Date.parse(endTime);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !Number.isFinite(threshold) || threshold <= 0) return undefined;
  const points = samples.filter(point => Number.isFinite(point.time) && Number.isFinite(point.value) && point.value > 0 && point.time >= start && point.time <= end)
    .sort((a, b) => a.time - b.time);
  const intensityIntervals: TrainingIntensityInterval[] = [];
  let hasCoverage = false;
  let intenseMs = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const duration = next.time - current.time;
    if (duration <= 0 || duration > 10 * 60 * 1000) continue;
    hasCoverage = true;
    if (current.value < threshold && next.value < threshold) continue;
    let intervalStart = current.time;
    let intervalEnd = next.time;
    if (current.value < threshold || next.value < threshold) {
      const crossing = current.time + duration * (threshold - current.value) / (next.value - current.value);
      if (current.value < threshold) intervalStart = crossing;
      else intervalEnd = crossing;
    }
    if (intervalEnd <= intervalStart) continue;
    intenseMs += intervalEnd - intervalStart;
    intensityIntervals.push({ startTime: new Date(intervalStart).toISOString(), endTime: new Date(intervalEnd).toISOString() });
  }
  return hasCoverage ? { intensityMinutes: intenseMs / 60000, intensityIntervals } : undefined;
}
