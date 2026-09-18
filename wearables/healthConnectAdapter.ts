import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  Permission,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

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

      const result = await readRecords('SleepSession', {
        timeRangeFilter: {
          operator: 'between',
          startTime: range.start,
          endTime: range.end,
        },
      });

      return result.records.map(record => {
        const stages = record.stages ?? [];

        const sumStageMinutes = (stageType: number) =>
          stages.filter(stage => stage.stage === stageType).reduce((sum, stage) => sum + minutesBetween(stage.startTime, stage.endTime), 0);

        return {
          source: this.source,
          date: toLocalDateISO(record.endTime),
          startTime: record.startTime,
          endTime: record.endTime,
          durationMinutes: minutesBetween(record.startTime, record.endTime),
          stages: {
            deepMinutes: sumStageMinutes(SLEEP_STAGE.deep),
            remMinutes: sumStageMinutes(SLEEP_STAGE.rem),
            lightMinutes: sumStageMinutes(SLEEP_STAGE.light),
            awakeMinutes: sumStageMinutes(SLEEP_STAGE.awake),
          },
        } satisfies SleepSummary;
      });
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
            sourceName: record.metadata?.dataOrigin,
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
      const result = await readRecords('HeartRateVariabilityRmssd', {
        timeRangeFilter: {
          operator: 'between',
          startTime: range.start,
          endTime: range.end,
        },
        ascendingOrder: true,
      });
      return result.records.map(record => ({
        source: this.source,
        date: toLocalDateISO(record.time),
        rmssdMs: record.heartRateVariabilityMillis,
      }));
    } catch (err) {
      console.warn('[HealthConnectAdapter] getHRV failed', err);
      return [];
    }
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
      for (const session of exerciseSessions) {
        const activeMinutes = minutesBetween(session.startTime, session.endTime);
        if (!Number.isFinite(activeMinutes) || activeMinutes <= 0) {
          continue;
        }
        const day = getDay(session.endTime);
        day.activeMinutes = (day.activeMinutes ?? 0) + activeMinutes;
        if (!maxHeartRate) {
          continue;
        }
        const heartRateSamples = await this.getHeartRateSamples({
          start: session.startTime,
          end: session.endTime,
        });
        const threshold = maxHeartRate * 0.7;
        const intenseMinutes = this.calculateIntenseMinutes(heartRateSamples, session.startTime, session.endTime, threshold);
        const lastIntenseExerciseAt = this.getLastIntenseExerciseAt(heartRateSamples, session.startTime, session.endTime, threshold);
        day.intensityMinutes = (day.intensityMinutes ?? 0) + intenseMinutes;
        if (lastIntenseExerciseAt) {
          const currentLastIntenseAt = day.lastIntenseExerciseAt;
          if (!currentLastIntenseAt || new Date(lastIntenseExerciseAt).getTime() > new Date(currentLastIntenseAt).getTime()) {
            day.lastIntenseExerciseAt = lastIntenseExerciseAt;
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
    const result = await readRecords('ExerciseSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: range.start,
        endTime: range.end,
      },
      ascendingOrder: true,
    });

    return result.records;
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
      }))
    );
  }

  private calculateIntenseMinutes(samples: Array<{ time: number; value: number }>, workoutStart: string, workoutEnd: string, threshold: number): number {
    const workoutStartMs = new Date(workoutStart).getTime();
    const workoutEndMs = new Date(workoutEnd).getTime();
    if (Number.isNaN(workoutStartMs) || Number.isNaN(workoutEndMs) || workoutEndMs <= workoutStartMs) {
      return 0;
    }
    const maxGapMs = 10 * 60 * 1000;
    const workoutSamples = samples
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

  async getEnergySignal(): Promise<any[]> {
    return [];
  }
}

export default HealthConnectAdapter;
