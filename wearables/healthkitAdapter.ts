import { getUserProfile } from '@/app/context/storage/userProfile/userProfileStore';
import type { MetricId } from '@/locales/metrics';

import { selectMetricSource, selectMetricSourcesByDay } from './metricSourcePriority';
import { normalizeSleep, type SleepInterval, type SleepState } from './normalizeSleep';
import { aggregateProvenance, healthKitProvenance } from './sampleProvenance';
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
import { healthKitWorkoutType } from './workoutTypes';

type RawSourceMetadata = { id?: string; sourceId?: string; sourceName?: string };

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

// Minimal shape for HealthKit sleep samples we consume
type RawSleepSample = RawSourceMetadata & {
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

type RawWorkoutSample = RawSourceMetadata & {
  start?: string;
  end?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  activityName?: string;
  activityId?: number;
  distance?: number;
};

type RawBloodPressureSample = RawSourceMetadata & {
  bloodPressureSystolicValue?: number;
  bloodPressureDiastolicValue?: number;
  startDate?: string;
  endDate?: string;
  sourceId?: string;
  sourceName?: string;
};

type RawHeartRateSample = RawSourceMetadata & {
  startDate?: string;
  endDate?: string;
  value?: number;
};

type RawHRVSample = RawSourceMetadata & {
  startDate?: string;
  endDate?: string;
  value?: number;
  sourceId?: string;
  sourceName?: string;
};

type RawVO2MaxSample = RawSourceMetadata & {
  startDate?: string;
  endDate?: string;
  value?: number;
  sourceId?: string;
  sourceName?: string;
};

function getSleepState(sample: RawSleepSample): SleepState {
  const value = String(sample.value ?? '').toLowerCase();
  if (value.includes('inbed') || value.includes('in_bed') || sample.value === 0) return 'inBed';
  if (value.includes('awake') || sample.value === 2) return 'awake';
  if (value.includes('deep') || sample.value === 4) return 'deep';
  if (value.includes('rem') || sample.value === 5) return 'rem';
  if (value.includes('core') || value.includes('light') || sample.value === 3) return 'light';
  if (value.includes('asleep') || sample.value === 1) return 'asleep';
  return 'unknown';
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

export class HealthKitAdapter implements WearableAdapter {
  source = 'healthkit' as const;
  private initialized = false;
  private initErrorMessage: string | null = null;

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

      const intervals: SleepInterval[] = samples.map(sample => ({
        ...healthKitProvenance(sample),
        startTime: sample.startDate ?? '',
        endTime: sample.endDate ?? '',
        state: getSleepState(sample),
      }));
      return normalizeSleep(intervals, this.source);
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
            ...healthKitProvenance(sample),
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
    samples = this.selectDailySamples(samples, 'hrv_sdnn');
    const byDate = this.groupSamplesByDate(samples);
    return Object.entries(byDate).map(([date, values]) => ({
      source: this.source,
      date,
      ...aggregateProvenance(
        samples
          .filter(sample => (sample.endDate ?? sample.startDate) && toLocalDateISO((sample.endDate ?? sample.startDate)!) === date)
          .map(healthKitProvenance)
      ),
      sdnnMs: this.average(values) * 1000,
    }));
  }

  private selectDailySamples<T extends RawSourceMetadata & { value?: number; startDate?: string; endDate?: string }>(samples: T[], metricId: MetricId): T[] {
    const valid = samples.flatMap(sample => {
      const recordedAt = sample.endDate ?? sample.startDate;
      if (!recordedAt || !Number.isFinite(Date.parse(recordedAt)) || !Number.isFinite(Number(sample.value))) return [];
      return [{ ...sample, ...healthKitProvenance(sample), date: toLocalDateISO(recordedAt) }];
    });
    return selectMetricSourcesByDay(valid, metricId);
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
      const samples = this.selectDailySamples(await this.getRestingHeartRateSamples(health, range), 'resting_hr');
      //console.debug('[HealthKitAdapter] resting HR samples count', samples.length);
      if (samples.length > 0) {
        //console.debug('[HealthKitAdapter] resting HR sample0', samples[0]);
      }
      const byDate = this.groupSamplesByDate(samples);
      return Object.entries(byDate).map(([date, values]) => ({
        source: this.source,
        date,
        ...aggregateProvenance(
          samples
            .filter(sample => (sample.endDate ?? sample.startDate) && toLocalDateISO((sample.endDate ?? sample.startDate)!) === date)
            .map(healthKitProvenance)
        ),
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
            ...healthKitProvenance(sample),
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
      const preferredWorkouts = selectMetricSourcesByDay(
        workoutSamples.flatMap(workout => {
          const start = workout.startDate ?? workout.start;
          const end = workout.endDate ?? workout.end;
          if (!start || !end || !Number.isFinite(Date.parse(end)) || !Number.isFinite(minutesBetween(start, end)) || minutesBetween(start, end) <= 0) return [];
          return [{ ...workout, ...healthKitProvenance(workout), date: toLocalDateISO(end) }];
        }),
        'active_minutes'
      );
      for (const workout of preferredWorkouts) {
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
        const workoutProvenance = healthKitProvenance(workout);
        day.workouts = [...(day.workouts ?? []), {
          source: 'healthkit',
          ...workoutProvenance,
          startTime: start,
          endTime: end,
          activityType: healthKitWorkoutType(workout.activityName),
          activityName: workout.activityName,
          // react-native-health's getSamples workout query returns miles.
          distanceKm: typeof workout.distance === 'number' && Number.isFinite(workout.distance) && workout.distance >= 0 ? workout.distance * 1.609344 : undefined,
        }];
        day.activeProvenance = aggregateProvenance([...(day.activeProvenance ? [day.activeProvenance] : []), workoutProvenance]);
        if (!maxHeartRate) {
          continue;
        }
        const sessionHeartRates = selectMetricSource(
          heartRateSamples
            .filter(sample => {
              const time = Date.parse(sample.startDate ?? sample.endDate ?? '');
              return time >= Date.parse(start) && time <= Date.parse(end) && Number.isFinite(Number(sample.value));
            })
            .map(sample => ({ ...sample, ...healthKitProvenance(sample) })),
          'intensity_minutes'
        );
        const intensityHrThreshold = maxHeartRate * 0.7;
        const intenseMinutes = this.calculateIntenseMinutes(sessionHeartRates, start, end, intensityHrThreshold);
        day.intensityMinutes = (day.intensityMinutes ?? 0) + intenseMinutes;
        const intensityProvenance = aggregateProvenance([
          workoutProvenance,
          ...sessionHeartRates
            .filter(sample => {
              const time = new Date(sample.startDate ?? sample.endDate ?? '').getTime();
              return time >= new Date(start).getTime() && time <= new Date(end).getTime();
            })
            .map(healthKitProvenance),
        ]);
        day.intensityProvenance = aggregateProvenance([...(day.intensityProvenance ? [day.intensityProvenance] : []), intensityProvenance]);
        const lastIntenseExerciseAt = this.getLastIntenseExerciseAt(sessionHeartRates, start, end, intensityHrThreshold);

        if (
          lastIntenseExerciseAt &&
          (!day.lastIntenseExerciseAt || new Date(lastIntenseExerciseAt).getTime() > new Date(day.lastIntenseExerciseAt).getTime())
        ) {
          day.lastIntenseExerciseAt = lastIntenseExerciseAt;
          day.lastIntenseProvenance = intensityProvenance;
        }
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

  private getDailyStepCounts(health: NonNullable<typeof AppleHealthKit>, range: TimeRange): Promise<Array<{ date: string; steps: number }>> {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const current = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const lastDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const dates: Date[] = [];
    while (current <= lastDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return Promise.all(
      dates.map(async date => ({
        date: toLocalDateISO(date.toISOString()),
        steps: await this.getStepCountForDate(health, date),
      }))
    );
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

  private getLastIntenseExerciseAt(samples: RawHeartRateSample[], workoutStart: string, workoutEnd: string, threshold: number): string | undefined {
    const workoutStartMs = new Date(workoutStart).getTime();
    const workoutEndMs = new Date(workoutEnd).getTime();
    const lastSample = samples
      .map(sample => {
        const recordedAt = sample.startDate ?? sample.endDate;
        return {
          recordedAt,
          time: recordedAt ? new Date(recordedAt).getTime() : Number.NaN,
          value: Number(sample.value),
        };
      })
      .filter(
        sample =>
          sample.recordedAt &&
          Number.isFinite(sample.time) &&
          Number.isFinite(sample.value) &&
          sample.time >= workoutStartMs &&
          sample.time <= workoutEndMs &&
          sample.value >= threshold
      )
      .sort((a, b) => b.time - a.time)[0];
    return lastSample?.recordedAt;
  }
}

export default HealthKitAdapter;
