import type { SampleProvenance } from '@/app/context/storage/metrics/metricTypes';
import type { TrainingActivityType, TrainingIntensityInterval } from '@/types/training';

export type SourceId = 'none' | 'mock' | 'garmin' | 'fitbit' | 'healthkit' | 'healthconnect';

export type TimeRange = {
  start: string; // ISO
  end: string; // ISO
};

export type SleepSummary = SampleProvenance & {
  source: SourceId;
  date: string; // YYYY-MM-DD (local)
  durationMinutes: number;
  startTime?: string; // ISO
  endTime?: string; // ISO
  efficiencyPct?: number; // 0..100 optional
  stages?: {
    deepMinutes?: number;
    remMinutes?: number;
    lightMinutes?: number;
    awakeMinutes?: number;
  };
};

export type SleepSummaryWithTarget = SleepSummary & { targetBedtime: string };

export type HRVSummary = SampleProvenance & {
  source: SourceId;
  date: string;
  recordedAt?: string; // Original sample timestamp; daily summaries may omit it.
  rmssdMs?: number;
  sdnnMs?: number;
};

export type RestingHeartRateSummary = SampleProvenance & {
  source: SourceId;
  date: string;
  bpm: number;
};

export type VO2MaxSummary = SampleProvenance & {
  source: SourceId;
  date: string;
  value: number;
};

export type WorkoutSession = SampleProvenance & {
  source: 'healthkit' | 'healthconnect';
  startTime: string;
  endTime: string;
  activityType: TrainingActivityType;
  activityName?: string;
  distanceKm?: number;
  highIntensityMinutes?: number;
  highIntensityIntervals?: TrainingIntensityInterval[];
  moderateMinutes?: number;
  moderateIntervals?: TrainingIntensityInterval[];
  intensityMinutes?: number;
  intensityIntervals?: TrainingIntensityInterval[];
};

export type DailyActivity = SampleProvenance & {
  source: SourceId;
  date: string; // YYYY-MM-DD
  workouts?: WorkoutSession[];
  activeProvenance?: SampleProvenance;
  intensityProvenance?: SampleProvenance;
  lastIntenseProvenance?: SampleProvenance;
  steps?: number;
  activeMinutes?: number;
  highIntensityMinutes?: number;
  highIntensityIntervals?: TrainingIntensityInterval[];
  moderateMinutes?: number;
  moderateIntervals?: TrainingIntensityInterval[];
  intensityMinutes?: number;
  lastIntenseExerciseAt?: string;
};

type AdapterStatusMeta = {
  lastSyncAt?: string;
};

export type AdapterStatus = (
  | { state: 'disconnected'; source: SourceId }
  | { state: 'connecting'; source: SourceId }
  | { state: 'connected'; source: SourceId }
  | { state: 'error'; message: string }
) &
  AdapterStatusMeta;

export interface BloodPressureReading extends SampleProvenance {
  recordedAt: string;
  systolic: number;
  diastolic: number;
  sourceName?: string;
}

export enum WearablePermission {
  sleep = 'sleep',
  steps = 'steps',
  heartRate = 'heartRate',
  restingHeartRate = 'restingHeartRate',
  hrv = 'hrv',
  bloodPressure = 'bloodPressure',
  workout = 'workout',
  vo2Max = 'vo2Max',
}

export interface WearableAdapter {
  source: SourceId;

  hasPermission(recordType: WearablePermission): Promise<boolean>;
  getStatus(): Promise<AdapterStatus>;

  // Optional auth methods (some adapters won't need these)
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;

  // Data fetches
  getSleep(range: TimeRange): Promise<SleepSummary[]>;
  getHRV(range: TimeRange): Promise<HRVSummary[]>;
  getRestingHeartRate(range: TimeRange): Promise<RestingHeartRateSummary[]>;
  getDailyActivity(range: TimeRange): Promise<DailyActivity[]>;
  getVO2Max(range: TimeRange): Promise<VO2MaxSummary[]>;
  getBloodPressure(range: TimeRange): Promise<BloodPressureReading[]>;
}
