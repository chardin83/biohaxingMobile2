import {
  aggregateRecord,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  Permission,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { getUserProfile } from '@/app/context/storage/userProfile/userProfileStore';
import { HIGH_INTENSITY_HEART_RATE_FRACTION, MODERATE_HEART_RATE_FRACTION, VIGOROUS_HEART_RATE_FRACTION } from '@/constants/TrainingIntensity';
import { calculateWorkoutAverageHeartRate, calculateWorkoutIntensity } from '@/utils/trainingIntensity';

import { selectMetricSource, selectMetricSourcesByDay } from './metricSourcePriority';
import { getSleepEpisodes, normalizeSleep, type SleepInterval, type SleepState } from './normalizeSleep';
import { aggregateProvenance, healthConnectProvenance } from './sampleProvenance';
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
  WorkoutSession,
} from './types';
import { healthConnectWorkoutType } from './workoutTypes';

const PERMISSIONS: Permission[] = [
  {
    accessType: 'read',
    recordType: 'SleepSession',
  },
  {
    accessType: 'read',
    recordType: 'Steps',
  },
  {
    accessType: 'read',
    recordType: 'ExerciseSession',
  },
  {
    accessType: 'read',
    recordType: 'HeartRate',
  },
  {
    accessType: 'read',
    recordType: 'RestingHeartRate',
  },
  {
    accessType: 'read',
    recordType: 'HeartRateVariabilityRmssd',
  },
  {
    accessType: 'read',
    recordType: 'Vo2Max',
  },
  {
    accessType: 'read',
    recordType: 'BloodPressure',
  },
];

const PERMISSION_RECORD_TYPES = {
  [WearablePermission.sleep]: 'SleepSession',
  [WearablePermission.steps]: 'Steps',
  [WearablePermission.heartRate]: 'HeartRate',
  [WearablePermission.restingHeartRate]: 'RestingHeartRate',
  [WearablePermission.hrv]: 'HeartRateVariabilityRmssd',
  [WearablePermission.bloodPressure]: 'BloodPressure',
  [WearablePermission.workout]: 'ExerciseSession',
  [WearablePermission.vo2Max]: 'Vo2Max',
} as const;

const SLEEP_STAGE = {
  awake: 1,
  sleeping: 2,
  outOfBed: 3,
  light: 4,
  deep: 5,
  rem: 6,
} as const;

function toLocalDateISO(dt: string) {
  const d = new Date(dt);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function minutesBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

function getPressureInMmHg(
  pressure:
    | number
    | {
        inMillimetersOfMercury?: number;
        inKilopascals?: number;
      }
    | null
    | undefined
): number | null {
  if (typeof pressure === 'number') {
    return Number.isFinite(pressure) ? pressure : null;
  }

  const mmHg = pressure?.inMillimetersOfMercury;

  if (typeof mmHg === 'number' && Number.isFinite(mmHg)) {
    return mmHg;
  }

  const kilopascals = pressure?.inKilopascals;

  if (typeof kilopascals === 'number' && Number.isFinite(kilopascals)) {
    return kilopascals * 7.50062;
  }

  return null;
}

export class HealthConnectAdapter implements WearableAdapter {
  source = 'healthconnect' as const;

  private initialized = false;

  private async ensureInit() {
    if (this.initialized) {
      return;
    }

    const status = await getSdkStatus();

    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
      throw new Error(`Health Connect not available. Status: ${status}`);
    }

    const initialized = await initialize();

    if (!initialized) {
      throw new Error('Health Connect initialize failed');
    }

    this.initialized = true;
  }

  async requestPermissions() {
    await this.ensureInit();

    const granted = await requestPermission(PERMISSIONS);

    return PERMISSIONS.every(required =>
      granted.some(permission => permission.accessType === required.accessType && permission.recordType === required.recordType)
    );
  }

  async hasPermissions() {
    await this.ensureInit();

    const granted = await getGrantedPermissions();

    return PERMISSIONS.every(required =>
      granted.some(permission => permission.accessType === required.accessType && permission.recordType === required.recordType)
    );
  }

  async hasPermission(permission: WearablePermission): Promise<boolean> {
    await this.ensureInit();
    const recordType = PERMISSION_RECORD_TYPES[permission];
    if (!recordType) return false;
    const granted = await getGrantedPermissions();
    return granted.some(grantedPermission => grantedPermission.accessType === 'read' && grantedPermission.recordType === recordType);
  }

  private async getPermissionStatus() {
    await this.ensureInit();
    const granted = await getGrantedPermissions();
    const grantedCount = PERMISSIONS.filter(required =>
      granted.some(permission => permission.accessType === required.accessType && permission.recordType === required.recordType)
    ).length;
    return {
      hasAnyPermissions: grantedCount > 0,
      hasAllPermissions: grantedCount === PERMISSIONS.length,
    };
  }

  async getStatus() {
    try {
      await this.ensureInit();
      const { hasAnyPermissions, hasAllPermissions } = await this.getPermissionStatus();
      return {
        state: hasAnyPermissions ? 'connected' : 'permissionRequired',
        source: this.source,
        hasMissingPermissions: !hasAllPermissions,
      } as any;
    } catch (err: any) {
      return {
        state: 'error',
        message: err?.message ?? String(err),
        source: this.source,
      } as any;
    }
  }

  async getSleep(range: TimeRange): Promise<SleepSummary[]> {
    try {
      await this.ensureInit();

      const records = [];
      let pageToken: string | undefined;
      do {
        const page = await readRecords('SleepSession', {
          timeRangeFilter: { operator: 'between', startTime: range.start, endTime: range.end },
          ascendingOrder: true,
          pageSize: 1000,
          pageToken,
        });
        records.push(...page.records);
        pageToken = page.pageToken;
      } while (pageToken);
      const stateByStage: Record<number, SleepState> = {
        [SLEEP_STAGE.awake]: 'awake',
        [SLEEP_STAGE.outOfBed]: 'awake',
        [SLEEP_STAGE.sleeping]: 'asleep',
        [SLEEP_STAGE.light]: 'light',
        [SLEEP_STAGE.deep]: 'deep',
        [SLEEP_STAGE.rem]: 'rem',
      };
      const intervals: SleepInterval[] = records.flatMap(record => {
        const provenance = healthConnectProvenance(record);
        const stages = record.stages ?? [];
        // Session-wide fallback is used only when there is no staging information.
        if (!stages.length) return [{ ...provenance, startTime: record.startTime, endTime: record.endTime, state: 'asleep' as const }];
        return stages.flatMap(stage => {
          const start = Math.max(Date.parse(stage.startTime), Date.parse(record.startTime));
          const end = Math.min(Date.parse(stage.endTime), Date.parse(record.endTime));
          if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return [];
          return [
            { ...provenance, startTime: new Date(start).toISOString(), endTime: new Date(end).toISOString(), state: stateByStage[stage.stage] ?? 'unknown' },
          ];
        });
      });
      const preferredSources = new Map<string, string[]>();
      for (const episode of getSleepEpisodes(intervals)) {
        if (new Set(episode.map(item => item.sourceId ?? item.sourceName ?? 'unknown')).size < 2) continue;
        try {
          const aggregate = await aggregateRecord({
            recordType: 'SleepSession',
            timeRangeFilter: {
              operator: 'between',
              startTime: new Date(episode[0].start).toISOString(),
              endTime: new Date(Math.max(...episode.map(item => item.end))).toISOString(),
            },
          });
          preferredSources.set(String(episode[0].start), aggregate.dataOrigins ?? []);
        } catch (error) {
          console.warn('[HealthConnectAdapter] Sleep source priority unavailable; resolving overlaps locally', error);
        }
      }
      return normalizeSleep(intervals, this.source, preferredSources);
    } catch (err) {
      console.warn('[HealthConnectAdapter] getSleep failed', err);

      return [];
    }
  }

  async getBloodPressure(range: TimeRange): Promise<BloodPressureReading[]> {
    try {
      await this.ensureInit();

      const result = await readRecords('BloodPressure', {
        timeRangeFilter: {
          operator: 'between',
          startTime: range.start,
          endTime: range.end,
        },
        ascendingOrder: true,
      });

      //console.log('[HealthConnectAdapter] Blood pressure records', JSON.stringify(result.records, null, 2));

      return result.records.flatMap(record => {
        const systolic = getPressureInMmHg(record.systolic);

        const diastolic = getPressureInMmHg(record.diastolic);

        const recordedAt = record.time;

        if (systolic === null || diastolic === null || !recordedAt || Number.isNaN(new Date(recordedAt).getTime())) {
          return [];
        }

        return [
          {
            systolic: Math.round(systolic * 10) / 10,
            diastolic: Math.round(diastolic * 10) / 10,
            recordedAt,
            ...healthConnectProvenance(record),
          } satisfies BloodPressureReading,
        ];
      });
    } catch (err) {
      console.warn('[HealthConnectAdapter] getBloodPressure failed', err);

      return [];
    }
  }

  async getHRV(range: TimeRange): Promise<HRVSummary[]> {
    try {
      await this.ensureInit();
      return await this.getHRVPages(range);
    } catch (err) {
      console.warn('[HealthConnectAdapter] getHRV failed', err);
      return [];
    }
  }

  private async getHRVPages(range: TimeRange, samples: HRVSummary[] = [], pageToken?: string): Promise<HRVSummary[]> {
    const result = await readRecords('HeartRateVariabilityRmssd', {
      timeRangeFilter: {
        operator: 'between',
        startTime: range.start,
        endTime: range.end,
      },
      ascendingOrder: true,
      pageSize: 1000,
      pageToken,
    });
    samples.push(
      ...result.records.map(record => ({
        source: this.source,
        ...healthConnectProvenance(record),
        date: toLocalDateISO(record.time),
        recordedAt: new Date(record.time).toISOString(),
        rmssdMs: record.heartRateVariabilityMillis,
      }))
    );
    // Each subsequent page depends on the token returned by the previous one.
    return result.pageToken ? this.getHRVPages(range, samples, result.pageToken) : samples;
  }

  async getRestingHeartRate(range: TimeRange): Promise<RestingHeartRateSummary[]> {
    try {
      await this.ensureInit();
      const result = await readRecords('RestingHeartRate', {
        timeRangeFilter: {
          operator: 'between',
          startTime: range.start,
          endTime: range.end,
        },
        ascendingOrder: true,
      });
      return result.records
        .filter(record => typeof record.beatsPerMinute === 'number')
        .map(record => ({
          source: this.source,
          ...healthConnectProvenance(record),
          date: toLocalDateISO(record.time),
          bpm: record.beatsPerMinute,
        }));
    } catch (err) {
      console.warn('[HealthConnectAdapter] getRestingHeartRate failed', err);
      return [];
    }
  }

  async getVO2Max(range: TimeRange): Promise<VO2MaxSummary[]> {
    try {
      await this.ensureInit();
      const result = await readRecords('Vo2Max', {
        timeRangeFilter: {
          operator: 'between',
          startTime: range.start,
          endTime: range.end,
        },
        ascendingOrder: true,
      });
      //console.log('[HealthConnectAdapter] VO2 max records', JSON.stringify(result.records, null, 2));
      return result.records
        .filter(record => typeof record.vo2MillilitersPerMinuteKilogram === 'number')
        .map(record => ({
          source: this.source,
          ...healthConnectProvenance(record),
          date: toLocalDateISO(record.time),
          value: Math.round(record.vo2MillilitersPerMinuteKilogram * 10) / 10,
        }));
    } catch (err) {
      console.warn('[HealthConnectAdapter] getVO2Max failed', err);
      return [];
    }
  }

  async getDailyActivity(range: TimeRange): Promise<DailyActivity[]> {
    try {
      await this.ensureInit();
      const [stepsResult, exerciseSessions, userProfile] = await Promise.all([
        readRecords('Steps', {
          timeRangeFilter: {
            operator: 'between',
            startTime: range.start,
            endTime: range.end,
          },
        }),
        this.getExerciseSessions(range),
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
      for (const record of stepsResult.records) {
        const day = getDay(record.endTime);
        day.steps = (day.steps ?? 0) + record.count;
      }
      const validSessions = selectMetricSourcesByDay(
        exerciseSessions
          .map(session => ({
            session,
            ...healthConnectProvenance(session),
            date: toLocalDateISO(session.endTime),
            activeMinutes: minutesBetween(session.startTime, session.endTime),
          }))
          .filter(({ activeMinutes, date }) => Number.isFinite(activeMinutes) && activeMinutes > 0 && !date.includes('NaN')),
        'active_minutes'
      );
      const sessionActivities = await Promise.all(
        validSessions.map(async ({ session, activeMinutes }) => ({
          session,
          activeMinutes,
          heartRateSamples: await this.getHeartRateSamples({ start: session.startTime, end: session.endTime }).catch(() => []),
        }))
      );
      for (const { session, activeMinutes, heartRateSamples } of sessionActivities) {
        const day = getDay(session.endTime);
        day.activeMinutes = (day.activeMinutes ?? 0) + activeMinutes;
        const sessionProvenance = healthConnectProvenance(session);
        const importedWorkout: WorkoutSession = {
          source: 'healthconnect',
          ...sessionProvenance,
          startTime: session.startTime,
          endTime: session.endTime,
          activityType: healthConnectWorkoutType(session.exerciseType),
          activityName: session.title,
        };
        day.workouts = [...(day.workouts ?? []), importedWorkout];
        day.activeProvenance = aggregateProvenance([...(day.activeProvenance ? [day.activeProvenance] : []), sessionProvenance]);
        const sessionHeartRates = selectMetricSource(
          heartRateSamples
            .filter(sample => sample.time >= Date.parse(session.startTime) && sample.time <= Date.parse(session.endTime) && Number.isFinite(sample.value))
            .map(sample => ({ ...sample, ...sample.provenance })),
          'intensity_minutes'
        );
        importedWorkout.averageHeartRate = calculateWorkoutAverageHeartRate(sessionHeartRates, session.startTime, session.endTime);
        if (!maxHeartRate) continue;
        const threshold = maxHeartRate * VIGOROUS_HEART_RATE_FRACTION;
        const workoutIntensity = calculateWorkoutIntensity(sessionHeartRates, session.startTime, session.endTime, threshold, maxHeartRate * MODERATE_HEART_RATE_FRACTION, maxHeartRate * HIGH_INTENSITY_HEART_RATE_FRACTION);
        const lastIntenseExerciseAt = this.getLastIntenseExerciseAt(sessionHeartRates, session.startTime, session.endTime, threshold);
        if (workoutIntensity) {
          Object.assign(importedWorkout, workoutIntensity);
          day.intensityMinutes = (day.intensityMinutes ?? 0) + workoutIntensity.intensityMinutes;
        }
        const intensityProvenance = aggregateProvenance([
          sessionProvenance,
          ...sessionHeartRates
            .filter(sample => sample.time >= new Date(session.startTime).getTime() && sample.time <= new Date(session.endTime).getTime())
            .map(sample => sample.provenance),
        ]);
        day.intensityProvenance = aggregateProvenance([...(day.intensityProvenance ? [day.intensityProvenance] : []), intensityProvenance]);
        if (lastIntenseExerciseAt) {
          const currentLastIntenseAt = day.lastIntenseExerciseAt;
          if (!currentLastIntenseAt || new Date(lastIntenseExerciseAt).getTime() > new Date(currentLastIntenseAt).getTime()) {
            day.lastIntenseExerciseAt = lastIntenseExerciseAt;
            day.lastIntenseProvenance = intensityProvenance;
          }
        }
      }

      return [...activityByDay.values()].map(activity => ({
        ...activity,
        steps: typeof activity.steps === 'number' ? Math.round(activity.steps) : undefined,
        activeMinutes: typeof activity.activeMinutes === 'number' ? Math.round(activity.activeMinutes) : undefined,
        intensityMinutes: typeof activity.intensityMinutes === 'number' ? Math.round(activity.intensityMinutes) : undefined,
      }));
    } catch (err) {
      console.warn('[HealthConnectAdapter] getDailyActivity failed', err);
      return [];
    }
  }

  private async getExerciseSessions(range: TimeRange) {
    const records = [];
    let pageToken: string | undefined;
    do {
      const result = await readRecords('ExerciseSession', {
        timeRangeFilter: { operator: 'between', startTime: range.start, endTime: range.end },
        ascendingOrder: true,
        pageToken,
      });
      records.push(...result.records);
      pageToken = result.pageToken;
    } while (pageToken);
    return records;
  }

  private async getHeartRateSamples(range: TimeRange) {
    const result = await readRecords('HeartRate', {
      timeRangeFilter: {
        operator: 'between',
        startTime: range.start,
        endTime: range.end,
      },
      ascendingOrder: true,
    });
    return result.records.flatMap(record =>
      record.samples.map(sample => ({
        time: new Date(sample.time).getTime(),
        value: sample.beatsPerMinute,
        provenance: healthConnectProvenance(record),
      }))
    );
  }

  private getLastIntenseExerciseAt(
    samples: Array<{ time: number; value: number }>,
    workoutStart: string,
    workoutEnd: string,
    threshold: number
  ): string | undefined {
    const workoutStartMs = new Date(workoutStart).getTime();
    const workoutEndMs = new Date(workoutEnd).getTime();
    if (Number.isNaN(workoutStartMs) || Number.isNaN(workoutEndMs) || workoutEndMs <= workoutStartMs) {
      return undefined;
    }
    const intenseSamples = samples.filter(
      sample =>
        Number.isFinite(sample.time) &&
        Number.isFinite(sample.value) &&
        sample.time >= workoutStartMs &&
        sample.time <= workoutEndMs &&
        sample.value >= threshold
    );
    intenseSamples.sort((left, right) => right.time - left.time);
    const lastIntenseSample = intenseSamples[0];
    return lastIntenseSample ? new Date(lastIntenseSample.time).toISOString() : undefined;
  }
}

export default HealthConnectAdapter;
