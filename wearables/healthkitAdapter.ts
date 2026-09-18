import { getUserProfile } from '@/app/context/storage/userProfile/userProfileStore';

import {
  BloodPressureReading,
  DailyActivity,
  HRVSummary,
  RestingHeartRateSummary,
  SleepSummary,
  TimeRange,
  VO2MaxSummary,
  WearableAdapter,
  WearablePermission,
} from './types';

type HealthKitModule = {
  initHealthKit?: (...args: any[]) => any;
  getSleepSamples?: (...args: any[]) => any;
  //getDailyStepCountSamples?: (...args: any[]) => any;
  getStepCount?: (...args: any[]) => any;
  getSamples?: (...args: any[]) => any;
  getHeartRateSamples?: (...args: any[]) => any;
  getHeartRateVariabilitySamples?: (...args: any[]) => any;
  getRestingHeartRateSamples?: (...args: any[]) => any;
  getBloodPressureSamples?: (...args: any[]) => any;
  getVo2MaxSamples?: (...args: any[]) => any;
  Constants?: {
    Permissions?: Record<string, string>;
  };
  default?: any;
  AppleHealthKit?: any;
  RNAppleHealthKit?: any;
};

let AppleHealthKit: HealthKitModule | null = null;

function getInitOptions() {
  const permissions = AppleHealthKit?.Constants?.Permissions;

  return {
    permissions: {
      read: [
        permissions?.SleepAnalysis ?? 'SleepAnalysis',
        permissions?.RestingHeartRate ?? 'RestingHeartRate',
        permissions?.HeartRate ?? 'HeartRate',
        permissions?.HeartRateVariability ?? 'HeartRateVariability',
        permissions?.BloodPressureSystolic ?? 'BloodPressureSystolic',
        permissions?.BloodPressureDiastolic ?? 'BloodPressureDiastolic',
        permissions?.StepCount ?? 'StepCount',
        permissions?.Workout ?? 'Workout',
        permissions?.Vo2Max ?? 'Vo2Max',
      ],
      write: [],
    },
  };
}

function toLocalDateISO(dt: string) {
  const d = new Date(dt);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function minutesBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

type SleepDayAggregate = {
  durationMinutes: number;
  stages: {
    deepMinutes?: number;
    remMinutes?: number;
    lightMinutes?: number;
    awakeMinutes?: number;
  };
  startTime?: string;
  endTime?: string;
};

type Interval = { start: number; end: number };

type SleepDayIntervals = {
  all: Interval[];
  deep: Interval[];
  rem: Interval[];
  light: Interval[];
  awake: Interval[];
};

// Minimal shape for HealthKit sleep samples we consume
type RawSleepSample = {
  value?: string | number | null;
  metadata?: Record<string, unknown> | string | null;
  startDate?: string;
  endDate?: string;
  sourceId?: string;
  sourceName?: string;
};

/*type RawStepSample = {
  startDate?: string;
  endDate?: string;
  value?: number;
};*/

type RawWorkoutSample = {
  start?: string;
  end?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  activityName?: string;
  activityId?: number;
};

type RawBloodPressureSample = {
  bloodPressureSystolicValue?: number;
  bloodPressureDiastolicValue?: number;
  startDate?: string;
  endDate?: string;
  sourceId?: string;
  sourceName?: string;
};

type RawHeartRateSample = {
  startDate?: string;
  endDate?: string;
  value?: number;
};

type RawHRVSample = {
  startDate?: string;
  endDate?: string;
  value?: number;
  sourceId?: string;
  sourceName?: string;
};

type RawVO2MaxSample = {
  startDate?: string;
  endDate?: string;
  value?: number;
  sourceId?: string;
  sourceName?: string;
};

function detectVendorFromSamples(samples: any[]): string | null {
  if (!samples?.length) {
    return null;
  }

  const vendors = [
    { name: 'Garmin', keywords: ['garmin'] },
    { name: 'Fitbit', keywords: ['fitbit'] },
    { name: 'Apple', keywords: ['apple', 'health'] },
    { name: 'Samsung', keywords: ['samsung'] },
  ];

  for (const sample of samples) {
    const source = [sample?.sourceId, sample?.source, sample?.sourceName].filter(Boolean).join(' ').toLowerCase();

    const vendor = vendors.find(({ keywords }) => keywords.some(keyword => source.includes(keyword)));

    if (vendor) {
      return vendor.name;
    }
  }

  return null;
}

function getStageKeyForSample(sample: RawSleepSample): 'deep' | 'rem' | 'light' | 'awake' {
  const rawValue = sample.value;
  const value = rawValue || rawValue === 0 ? String(rawValue).toLowerCase() : '';
  const metadataStr = sample.metadata ? JSON.stringify(sample.metadata).toLowerCase() : '';

  if (value.includes('deep') || metadataStr.includes('deep')) return 'deep';
  // Some vendors (e.g. Garmin) label segments as 'CORE'. Map to light by default.
  if (value.includes('core') || metadataStr.includes('core')) return 'light';
  if (value.includes('rem') || metadataStr.includes('rem')) return 'rem';
  if (value.includes('awake') || value.includes('wake') || metadataStr.includes('awake') || metadataStr.includes('wake')) return 'awake';
  if (typeof rawValue === 'number' && rawValue === 2) return 'awake';
  return 'light';
}

function mergeIntervalsTotalMinutes(intervals: Interval[]) {
  if (!intervals || intervals.length === 0) return 0;
  const sorted = intervals.slice().sort((a, b) => a.start - b.start);
  let total = 0;
  let cur = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const it = sorted[i];
    if (it.start <= cur.end) {
      // overlap or contiguous
      cur.end = Math.max(cur.end, it.end);
    } else {
      total += Math.round((cur.end - cur.start) / 60000);
      cur = { ...it };
    }
  }
  total += Math.round((cur.end - cur.start) / 60000);
  return total;
}

// Try to locate a usable react-native-health module shape from exports/native modules
function findHealthKitModule(mod: unknown, NativeModules: Record<string, unknown>): HealthKitModule | null {
  const candidates: any[] = [
    (mod as any) && ((mod as any).default || (mod as any).AppleHealthKit || (mod as any).RNAppleHealthKit),
    mod,
    (NativeModules as any).RNAppleHealthKit,
    (NativeModules as any).AppleHealthKit,
    (NativeModules as any).RCTAppleHealthKit,
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (typeof c.initHealthKit === 'function') return c;
    if (typeof c.getSleepSamples === 'function') return c;
  }
  return null;
}

async function callInitHealthKit(mod: HealthKitModule) {
  const initOptions = getInitOptions();
  await new Promise<void>((resolve, reject) => {
    const fn = mod.initHealthKit as any;
    fn(initOptions, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// Merge a sample into the given dateKey (used for session-based grouping)
function mergeSleepSampleWithKey(byDate: Record<string, SleepDayAggregate>, sample: RawSleepSample, dateKey: string) {
  const start = new Date(sample.startDate ?? 0);
  const end = new Date(sample.endDate ?? 0);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return;
  }
  // Skip overall INBED summary samples which would double-count duration
  const rawValue = sample.value;
  const valueStr = rawValue || rawValue === 0 ? String(rawValue).toLowerCase() : '';
  if (valueStr.includes('inbed') || valueStr.includes('in_bed')) {
    return;
  }

  // Ensure aggregate object exists and has interval buckets
  if (!byDate[dateKey]) {
    byDate[dateKey] = { durationMinutes: 0, stages: {}, startTime: sample.startDate, endTime: sample.endDate };
    const intervals: SleepDayIntervals = {
      all: [],
      deep: [],
      rem: [],
      light: [],
      awake: [],
    };
    (byDate as any)[dateKey]._intervals = intervals;
  }

  const day = byDate[dateKey];
  const ints = (byDate as any)[dateKey]._intervals as SleepDayIntervals;

  const interval: Interval = { start: start.getTime(), end: end.getTime() };
  ints.all.push(interval);
  const stageKey = getStageKeyForSample(sample);
  (ints as any)[stageKey].push(interval);

  // keep earliest start and latest end for the day
  if (!day.startTime || start.getTime() < new Date(day.startTime).getTime()) {
    day.startTime = sample.startDate;
  }
  if (!day.endTime || end.getTime() > new Date(day.endTime).getTime()) {
    day.endTime = sample.endDate;
  }

  byDate[dateKey] = day;
}

// After collecting intervals via mergeSleepSample, compute merged totals per day
function finalizeAggregates(byDate: Record<string, SleepDayAggregate>) {
  Object.keys(byDate).forEach(dateKey => {
    const day = byDate[dateKey];
    const ints = (byDate as any)[dateKey]._intervals as SleepDayIntervals | undefined;
    if (!ints) {
      // Fallback: leave existing duration/stages
      return;
    }

    day.durationMinutes = mergeIntervalsTotalMinutes(ints.all);

    day.stages.deepMinutes = mergeIntervalsTotalMinutes(ints.deep);
    day.stages.remMinutes = mergeIntervalsTotalMinutes(ints.rem);
    day.stages.lightMinutes = mergeIntervalsTotalMinutes(ints.light);
    day.stages.awakeMinutes = mergeIntervalsTotalMinutes(ints.awake);
  });
}

export class HealthKitAdapter implements WearableAdapter {
  source = 'healthkit' as const;
  private initialized = false;
  private initErrorMessage: string | null = null;
  private vendor: string | null = null;

  private async ensureInit() {
    if (this.initialized) return;
    if (this.initErrorMessage) throw new Error(this.initErrorMessage);

    try {
      const mod = require('react-native-health');
      const RN = require('react-native');
      const NativeModules = RN?.NativeModules ?? {};

      const found = findHealthKitModule(mod, NativeModules);
      AppleHealthKit = found || (mod && (mod.default || mod.AppleHealthKit || mod));

      if (!AppleHealthKit || typeof AppleHealthKit.initHealthKit !== 'function') {
        const modKeys = Object.keys(mod || {}).join(', ');
        throw new TypeError(`react-native-health initHealthKit is not a function. module keys: ${modKeys}`);
      }

      await callInitHealthKit(AppleHealthKit);
      this.initialized = true;
    } catch (err) {
      this.initErrorMessage = err instanceof Error ? err.message : String(err);
      throw err;
    }
  }

  async hasPermission(permission: WearablePermission): Promise<boolean> {
    try {
      await this.ensureInit();
      const health = AppleHealthKit;
      if (!health) return false;

      switch (permission) {
        case WearablePermission.sleep:
          return typeof health.getSleepSamples === 'function';
        case WearablePermission.steps:
          return typeof health.getStepCount === 'function';
        case WearablePermission.heartRate:
          return typeof health.getHeartRateSamples === 'function';
        case WearablePermission.restingHeartRate:
          return typeof health.getRestingHeartRateSamples === 'function';
        case WearablePermission.hrv:
          return typeof health.getHeartRateVariabilitySamples === 'function';
        case WearablePermission.vo2Max:
          return typeof health.getVo2MaxSamples === 'function';
        case WearablePermission.bloodPressure:
          return typeof health.getBloodPressureSamples === 'function';
        case WearablePermission.workout:
          return typeof health.getSamples === 'function';
        default:
          return false;
      }
    } catch {
      return false;
    }
  }
  async getStatus() {
    try {
      await this.ensureInit();
      return { state: 'connected', source: this.source } as any;
    } catch (err: any) {
      return { state: 'error', message: err?.message ?? String(err), source: this.source } as any;
    }
  }

  private toError(error: unknown): Error {
    return error instanceof Error ? error : new Error(String(error));
  }

  private groupSleepSamplesIntoSessions(samples: RawSleepSample[]): RawSleepSample[][] {
    const sorted = [...samples].sort((a, b) => new Date(a.startDate ?? a.endDate ?? 0).getTime() - new Date(b.startDate ?? b.endDate ?? 0).getTime());
    const sessions: RawSleepSample[][] = [];
    const graceMs = 1000;
    let currentSession: RawSleepSample[] = [];
    let currentEnd = 0;

    for (const sample of sorted) {
      const start = new Date(sample.startDate ?? sample.endDate ?? 0).getTime();
      const end = new Date(sample.endDate ?? sample.startDate ?? 0).getTime();

      if (currentSession.length > 0 && start > currentEnd + graceMs) {
        sessions.push(currentSession);
        currentSession = [];
      }

      currentSession.push(sample);
      currentEnd = Math.max(currentEnd, end);
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  private aggregateSleepSessions(sessions: RawSleepSample[][]): Record<string, SleepDayAggregate> {
    const byDate: Record<string, SleepDayAggregate> = {};

    for (const session of sessions) {
      const sessionEnd = Math.max(...session.map(sample => new Date(sample.endDate ?? sample.startDate ?? 0).getTime()));

      const dateKey = toLocalDateISO(new Date(sessionEnd).toISOString());

      for (const sample of session) {
        mergeSleepSampleWithKey(byDate, sample, dateKey);
      }
    }

    finalizeAggregates(byDate);

    return byDate;
  }

  private mapSleepAggregates(byDate: Record<string, SleepDayAggregate>, source: SleepSummary['source']): SleepSummary[] {
    return Object.entries(byDate).map(([date, aggregate]) => ({
      source,
      date,
      durationMinutes: aggregate.durationMinutes,
      startTime: aggregate.startTime,
      endTime: aggregate.endTime,
      stages: {
        deepMinutes: aggregate.stages.deepMinutes ?? 0,
        remMinutes: aggregate.stages.remMinutes ?? 0,
        lightMinutes: aggregate.stages.lightMinutes ?? 0,
        awakeMinutes: aggregate.stages.awakeMinutes ?? 0,
      },
    }));
  }

  async getSleep(range: TimeRange): Promise<SleepSummary[]> {
    try {
      await this.ensureInit();

      const health = AppleHealthKit;

      if (!health || typeof (health.getSleepSamples as any) !== 'function') {
        throw new Error('AppleHealthKit.getSleepSamples is not available');
      }

      const samples: RawSleepSample[] = await new Promise((resolve, reject) => {
        (health.getSleepSamples as any)(
          {
            startDate: range.start,
            endDate: range.end,
          },
          (err: unknown, results: RawSleepSample[] | undefined) => {
            if (err) {
              reject(this.toError(err));
              return;
            }

            resolve(results ?? []);
          }
        );
      });

      const vendor = detectVendorFromSamples(samples);

      if (vendor) {
        this.vendor = vendor;
      }

      //console.debug('[HealthKitAdapter] raw sleep samples', samples);

      const sessions = this.groupSleepSamplesIntoSessions(samples);

      const byDate = this.aggregateSleepSessions(sessions);

      return this.mapSleepAggregates(byDate, this.source);
    } catch (error) {
      if (error instanceof Error) {
        this.initErrorMessage = error.message;
      }

      return [];
    }
  }

  async getBloodPressure(range: TimeRange): Promise<BloodPressureReading[]> {
    try {
      await this.ensureInit();

      const health = AppleHealthKit;

      if (!health || typeof health.getBloodPressureSamples !== 'function') {
        throw new Error('AppleHealthKit.getBloodPressureSamples is not available');
      }

      const samples = await new Promise<RawBloodPressureSample[]>((resolve, reject) => {
        health.getBloodPressureSamples!(
          {
            unit: 'mmhg',
            startDate: range.start,
            endDate: range.end,
            ascending: true,
          },
          (err: unknown, results: RawBloodPressureSample[] | undefined) => {
            if (err) {
              reject(this.toError(err));
              return;
            }

            resolve(results ?? []);
          }
        );
      });

      const vendor = detectVendorFromSamples(samples);

      if (vendor) {
        this.vendor = vendor;
      }

      return samples.flatMap(sample => {
        const systolic = Number(sample.bloodPressureSystolicValue);

        const diastolic = Number(sample.bloodPressureDiastolicValue);

        const recordedAt = sample.startDate ?? sample.endDate;

        if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || !recordedAt || Number.isNaN(new Date(recordedAt).getTime())) {
          return [];
        }

        return [
          {
            systolic,
            diastolic,
            recordedAt,
            sourceName: sample.sourceName ?? sample.sourceId,
          } satisfies BloodPressureReading,
        ];
      });
    } catch (error) {
      console.warn('[HealthKitAdapter] getBloodPressure failed', error);

      return [];
    }
  }

  async getHRV(range: TimeRange): Promise<HRVSummary[]> {
    try {
      await this.ensureInit();
      const health = AppleHealthKit;
      if (!health || typeof health.getHeartRateVariabilitySamples !== 'function') {
        console.debug('[HealthKitAdapter] getHeartRateVariabilitySamples is not available');
        return [];
      }
      const samples = await this.getHeartRateVariabilitySamples(health, range);
      //console.debug('[HealthKitAdapter] HRV samples count', samples.length);
      /*if (samples.length > 0) {
        console.debug('[HealthKitAdapter] HRV sample0', samples[0]);
      }*/
      return this.toHRVSummaries(samples);
    } catch (error) {
      console.warn('[HealthKitAdapter] getHRV failed', error);
      return [];
    }
  }

  private getHeartRateVariabilitySamples(health: HealthKitModule, range: TimeRange): Promise<RawHRVSample[]> {
    return new Promise((resolve, reject) => {
      health.getHeartRateVariabilitySamples!(
        {
          startDate: range.start,
          endDate: range.end,
        },
        (error: unknown, results: RawHRVSample[] | undefined) => {
          if (error) {
            reject(this.toError(error));
            return;
          }
          resolve(results ?? []);
        }
      );
    });
  }

  private toHRVSummaries(samples: RawHRVSample[]): HRVSummary[] {
    const byDate = this.groupSamplesByDate(samples);
    return Object.entries(byDate).map(([date, values]) => ({
      source: this.source,
      date,
      sdnnMs: this.average(values) * 1000,
    }));
  }

  private average(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private groupSamplesByDate(
    samples: Array<{
      value?: number;
      startDate?: string;
      endDate?: string;
    }>
  ): Record<string, number[]> {
    return samples.reduce<Record<string, number[]>>((result, sample) => {
      const value = Number(sample.value);
      const sampleDate = sample.endDate ?? sample.startDate;
      if (!Number.isFinite(value) || !sampleDate) {
        return result;
      }
      const date = new Date(sampleDate);
      if (Number.isNaN(date.getTime())) {
        return result;
      }
      const dateKey = toLocalDateISO(sampleDate);
      result[dateKey] ??= [];
      result[dateKey].push(value);
      return result;
    }, {});
  }

  async getRestingHeartRate(range: TimeRange): Promise<RestingHeartRateSummary[]> {
    try {
      await this.ensureInit();
      const health = AppleHealthKit;
      if (!health || typeof health.getRestingHeartRateSamples !== 'function') {
        console.debug('[HealthKitAdapter] getRestingHeartRateSamples is not available');
        return [];
      }
      const samples = await this.getRestingHeartRateSamples(health, range);
      //console.debug('[HealthKitAdapter] resting HR samples count', samples.length);
      if (samples.length > 0) {
        //console.debug('[HealthKitAdapter] resting HR sample0', samples[0]);
      }
      const byDate = this.groupSamplesByDate(samples);
      return Object.entries(byDate).map(([date, values]) => ({
        source: this.source,
        date,
        bpm: this.average(values),
      }));
    } catch (error) {
      console.warn('[HealthKitAdapter] getRestingHeartRate failed', error);
      return [];
    }
  }

  private getRestingHeartRateSamples(health: HealthKitModule, range: TimeRange): Promise<RawHeartRateSample[]> {
    return new Promise((resolve, reject) => {
      health.getRestingHeartRateSamples!(
        {
          startDate: range.start,
          endDate: range.end,
        },
        (error: unknown, results: RawHeartRateSample[] | undefined) => {
          if (error) {
            reject(this.toError(error));
            return;
          }
          resolve(results ?? []);
        }
      );
    });
  }

  private async getHeartRateSamples(range: TimeRange): Promise<RawHeartRateSample[]> {
    await this.ensureInit();

    const health = AppleHealthKit;

    if (!health || typeof (health.getHeartRateSamples as any) !== 'function') {
      throw new Error('AppleHealthKit.getHeartRateSamples is not available');
    }

    return new Promise((resolve, reject) => {
      (health.getHeartRateSamples as any)(
        {
          startDate: range.start,
          endDate: range.end,
        },
        (err: any, results: RawHeartRateSample[]) => {
          if (err) return reject(err);
          resolve(results ?? []);
        }
      );
    });
  }

  async getVO2Max(range: TimeRange): Promise<VO2MaxSummary[]> {
    try {
      await this.ensureInit();
      const health = AppleHealthKit;
      if (!health || typeof health.getVo2MaxSamples !== 'function') {
        console.debug('[HealthKitAdapter] getVo2MaxSamples is not available');
        return [];
      }
      const samples = await this.getVo2MaxSamples(health, range);
      //console.log('[HealthKitAdapter] VO2 max sample', JSON.stringify(samples, null, 2));

      return samples.flatMap(sample => {
        const value = Number(sample.value);
        const sampleDate = sample.endDate ?? sample.startDate;

        if (!Number.isFinite(value) || !sampleDate) {
          return [];
        }
        return [
          {
            source: this.source,
            date: toLocalDateISO(sampleDate),
            value: Math.round(value * 10) / 10,
          } satisfies VO2MaxSummary,
        ];
      });
    } catch (error) {
      console.warn('[HealthKitAdapter] getVO2Max failed', error);
      return [];
    }
  }

  private getVo2MaxSamples(health: HealthKitModule, range: TimeRange): Promise<RawVO2MaxSample[]> {
    return new Promise((resolve, reject) => {
      health.getVo2MaxSamples!(
        {
          startDate: range.start,
          endDate: range.end,
        },
        (error: unknown, results: RawVO2MaxSample[] | undefined) => {
          if (error) {
            reject(this.toError(error));
            return;
          }
          resolve(results ?? []);
        }
      );
    });
  }

  async getDailyActivity(range: TimeRange): Promise<DailyActivity[]> {
    try {
      await this.ensureInit();
      const health = AppleHealthKit;
      if (!health) {
        return [];
      }
      const [dailyStepCounts, workoutSamples, heartRateSamples, userProfile] = await Promise.all([
        this.getDailyStepCounts(health, range),
        this.getWorkoutSamples(health, range),
        this.getHeartRateSamples(range),
        getUserProfile(),
      ]);
      const maxHeartRate = userProfile.maxHeartRate;
      const activityByDay = new Map<string, DailyActivity>();
      const getDay = (date: string) => {
        const dateKey = toLocalDateISO(date);
        const existing = activityByDay.get(dateKey);
        if (existing) {
          return existing;
        }
        const created: DailyActivity = {
          source: this.source,
          date: dateKey,
        };
        activityByDay.set(dateKey, created);
        return created;
      };
      for (const entry of dailyStepCounts) {
        const day = getDay(entry.date);
        day.steps = entry.steps;
      }
      for (const workout of workoutSamples) {
        const start = workout.startDate ?? workout.start;
        const end = workout.endDate ?? workout.end;
        if (!start || !end) {
          continue;
        }
        const activeMinutes = minutesBetween(start, end);
        if (!Number.isFinite(activeMinutes) || activeMinutes <= 0) {
          continue;
        }
        const day = getDay(end);
        day.activeMinutes = (day.activeMinutes ?? 0) + activeMinutes;
        if (!maxHeartRate) {
          continue;
        }
        const intensityHrThreshold = maxHeartRate * 0.7;
        const intenseMinutes = this.calculateIntenseMinutes(heartRateSamples, start, end, intensityHrThreshold);
        day.intensityMinutes = (day.intensityMinutes ?? 0) + intenseMinutes;
      }
      return [...activityByDay.values()].map(entry => ({
        ...entry,
        steps: typeof entry.steps === 'number' ? Math.round(entry.steps) : undefined,
        activeMinutes: typeof entry.activeMinutes === 'number' ? Math.round(entry.activeMinutes) : undefined,
        intensityMinutes: typeof entry.intensityMinutes === 'number' ? Math.round(entry.intensityMinutes) : undefined,
      }));
    } catch (error) {
      console.warn('[HealthKitAdapter] getDailyActivity failed', error);
      return [];
    }
  }

  private async getStepCountForDate(health: NonNullable<typeof AppleHealthKit>, date: Date): Promise<number> {
    return new Promise((resolve, reject) => {
      if (typeof health.getStepCount !== 'function') {
        throw new TypeError('AppleHealthKit.getStepCount is not available');
      }
      health.getStepCount(
        {
          date: date.toISOString(),
          includeManuallyAdded: true,
        },
        (error: unknown, result: { value?: number } | undefined) => {
          if (error) {
            reject(this.toError(error));
            return;
          }
          const value = Number(result?.value ?? 0);
          resolve(Number.isFinite(value) ? value : 0);
        }
      );
    });
  }

  private async getDailyStepCounts(health: NonNullable<typeof AppleHealthKit>, range: TimeRange): Promise<Array<{ date: string; steps: number }>> {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const lastDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const result: Array<{ date: string; steps: number }> = [];
    while (current <= lastDate) {
      const date = new Date(current);
      const steps = await this.getStepCountForDate(health, date);
      result.push({
        date: toLocalDateISO(date.toISOString()),
        steps,
      });
      current.setDate(current.getDate() + 1);
    }
    return result;
  }

  private getWorkoutSamples(health: HealthKitModule, range: TimeRange): Promise<RawWorkoutSample[]> {
    return new Promise((resolve, reject) => {
      health.getSamples!(
        {
          startDate: range.start,
          endDate: range.end,
          type: 'Workout',
        },
        (error: unknown, results: RawWorkoutSample[] | undefined) => {
          if (error) {
            reject(this.toError(error));
            return;
          }
          resolve(results ?? []);
        }
      );
    });
  }

  private calculateIntenseMinutes(samples: RawHeartRateSample[], workoutStart: string, workoutEnd: string, threshold: number): number {
    const workoutStartMs = new Date(workoutStart).getTime();
    const workoutEndMs = new Date(workoutEnd).getTime();
    if (Number.isNaN(workoutStartMs) || Number.isNaN(workoutEndMs) || workoutEndMs <= workoutStartMs) {
      return 0;
    }
    const maxGapMs = 10 * 60 * 1000;
    const workoutSamples = samples
      .map(sample => {
        const recordedAt = sample.startDate ?? sample.endDate;
        return {
          time: recordedAt ? new Date(recordedAt).getTime() : Number.NaN,
          value: Number(sample.value),
        };
      })
      .filter(sample => Number.isFinite(sample.time) && Number.isFinite(sample.value) && sample.time >= workoutStartMs && sample.time <= workoutEndMs)
      .sort((left, right) => left.time - right.time);
    if (workoutSamples.length < 2) {
      return 0;
    }
    let intenseMs = 0;
    for (let i = 0; i < workoutSamples.length - 1; i++) {
      const current = workoutSamples[i];
      const next = workoutSamples[i + 1];
      const durationMs = next.time - current.time;
      if (durationMs <= 0 || durationMs > maxGapMs) {
        continue;
      }
      if (current.value >= threshold && next.value >= threshold) {
        intenseMs += durationMs;
        continue;
      }
      if (current.value < threshold && next.value < threshold) {
        continue;
      }
      const fraction = (threshold - current.value) / (next.value - current.value);
      const crossingTime = current.time + durationMs * fraction;
      if (current.value < threshold) {
        intenseMs += next.time - crossingTime;
      } else {
        intenseMs += crossingTime - current.time;
      }
    }
    return intenseMs / 60000;
  }

  async getEnergySignal(): Promise<any[]> {
    return [];
  }
}

export default HealthKitAdapter;
