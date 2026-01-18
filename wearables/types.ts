export type SourceId = 'mock' | 'garmin' | 'fitbit' | 'healthkit' | 'healthconnect';

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

export type HRVSummary = {
  source: SourceId;
  date: string; // YYYY-MM-DD
  rmssdMs?: number; // common HRV metric
  sdnnMs?: number; // optional
  avgRestingHrBpm?: number;
};

export type DailyActivity = {
  source: SourceId;
  date: string; // YYYY-MM-DD
  steps?: number;
  activeMinutes?: number;
};

export type EnergySignal = {
  source: SourceId;
  date: string; // YYYY-MM-DD
  // Garmin Body Battery-like if available:
  bodyBatteryLevel?: number; // 0..100
};

export type AdapterStatus =
  | { state: 'disconnected' }
  | { state: 'connecting' }
  | { state: 'connected'; source: SourceId }
  | { state: 'error'; message: string };

export interface WearableAdapter {
  source: SourceId;

  getStatus(): Promise<AdapterStatus>;

  // Optional auth methods (some adapters won't need these)
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;

  // Data fetches
  getSleep(range: TimeRange): Promise<SleepSummary[]>;
  getHRV(range: TimeRange): Promise<HRVSummary[]>;
  getDailyActivity(range: TimeRange): Promise<DailyActivity[]>;
  getEnergySignal(range: TimeRange): Promise<EnergySignal[]>;
}
