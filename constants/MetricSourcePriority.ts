import type { MetricId } from '@/locales/metrics';

export type MetricSourceFamily = 'oura' | 'apple' | 'garmin' | 'samsung' | 'fitbit' | 'polar' | 'whoop' | 'omron' | 'withings' | 'hume';

// Product defaults, not a ranking of medical accuracy. First available source wins.
export const SLEEP_SOURCE_PRIORITY: readonly MetricSourceFamily[] = ['oura', 'apple', 'fitbit', 'whoop', 'garmin', 'samsung', 'hume'];
const ACTIVITY_PRIORITY: readonly MetricSourceFamily[] = ['garmin', 'apple', 'samsung', 'fitbit', 'polar', 'whoop', 'oura', 'hume'];
const HEART_PRIORITY: readonly MetricSourceFamily[] = ['apple', 'garmin', 'oura', 'samsung', 'fitbit', 'polar', 'whoop', 'hume'];
const BLOOD_PRESSURE_PRIORITY: readonly MetricSourceFamily[] = ['omron', 'withings', 'apple', 'samsung', 'garmin', 'fitbit', 'oura'];

export const METRIC_SOURCE_PRIORITIES: Partial<Record<MetricId, readonly MetricSourceFamily[]>> = {
  sleep_duration: SLEEP_SOURCE_PRIORITY,
  deep_sleep: SLEEP_SOURCE_PRIORITY,
  rem_sleep: SLEEP_SOURCE_PRIORITY,
  sleep_bedtime: SLEEP_SOURCE_PRIORITY,
  resting_hr: HEART_PRIORITY,
  hrv_rmssd: HEART_PRIORITY,
  hrv_sdnn: HEART_PRIORITY,
  vo2_max: ['garmin', 'apple', 'samsung', 'fitbit', 'oura'],
  active_minutes: ACTIVITY_PRIORITY,
  intensity_minutes: ACTIVITY_PRIORITY,
  intense_exercise_before_sleep: ACTIVITY_PRIORITY,
  steps: ACTIVITY_PRIORITY,
  systolic_bp: BLOOD_PRESSURE_PRIORITY,
  diastolic_bp: BLOOD_PRESSURE_PRIORITY,
};
