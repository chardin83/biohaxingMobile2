export type SourceId = 'none' | 'mock' | 'garmin' | 'fitbit' | 'healthkit' | 'healthconnect';

export type TimeRange = {
  start: string; // ISO
  end: string; // ISO
};

export type SleepSummary = {
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

export type HRVSummary = {
  source: SourceId;
  date: string;
  rmssdMs?: number;
  sdnnMs?: number;
};

export type RestingHeartRateSummary = {
  source: SourceId;
  date: string;
  bpm: number;
};

export type VO2MaxSummary = {
  source: SourceId;
  date: string;
  value: number;
};

export type DailyActivity = {
  source: SourceId;
  date: string; // YYYY-MM-DD
  steps?: number;
  activeMinutes?: number;
  intensityMinutes?: number;
  lastIntenseExerciseAt?: string;
};

export type EnergySignal = {
  source: SourceId;
  date: string; // YYYY-MM-DD
  // Garmin Body Battery-like if available:
  bodyBatteryLevel?: number; // 0..100
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

export interface BloodPressureReading {
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
  getEnergySignal(range: TimeRange): Promise<EnergySignal[]>;
  getBloodPressure(range: TimeRange): Promise<BloodPressureReading[]>;
}
