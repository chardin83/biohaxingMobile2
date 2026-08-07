import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  Permission,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import {
  BloodPressureReading,
  DailyActivity,
  HRVSummary,
  SleepSummary,
  TimeRange,
  WearableAdapter,
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
    recordType: 'HeartRate',
  },
  {
    accessType: 'read',
    recordType: 'RestingHeartRate',
  },
  {
    accessType: 'read',
    recordType: 'BloodPressure',
  },
];

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

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function minutesBetween(
  start: string,
  end: string,
) {
  return Math.round(
    (new Date(end).getTime() -
      new Date(start).getTime()) /
    60000,
  );
}

function getPressureInMmHg(
  pressure:
    | number
    | {
      inMillimetersOfMercury?: number;
      inKilopascals?: number;
    }
    | null
    | undefined,
): number | null {
  if (typeof pressure === 'number') {
    return Number.isFinite(pressure)
      ? pressure
      : null;
  }

  const mmHg =
    pressure?.inMillimetersOfMercury;

  if (
    typeof mmHg === 'number' &&
    Number.isFinite(mmHg)
  ) {
    return mmHg;
  }

  const kilopascals =
    pressure?.inKilopascals;

  if (
    typeof kilopascals === 'number' &&
    Number.isFinite(kilopascals)
  ) {
    return kilopascals * 7.50062;
  }

  return null;
}

export class HealthConnectAdapter
  implements WearableAdapter {
  source = 'healthconnect' as const;

  private initialized = false;

  private async ensureInit() {
    if (this.initialized) {
      return;
    }

    const status = await getSdkStatus();

    if (
      status !==
      SdkAvailabilityStatus.SDK_AVAILABLE
    ) {
      throw new Error(
        `Health Connect not available. Status: ${status}`,
      );
    }

    const initialized = await initialize();

    if (!initialized) {
      throw new Error(
        'Health Connect initialize failed',
      );
    }

    this.initialized = true;
  }

  async requestPermissions() {
    await this.ensureInit();

    const granted =
      await requestPermission(PERMISSIONS);

    return PERMISSIONS.every(required =>
      granted.some(
        permission =>
          permission.accessType ===
          required.accessType &&
          permission.recordType ===
          required.recordType,
      ),
    );
  }

  async hasPermissions() {
    await this.ensureInit();

    const granted =
      await getGrantedPermissions();

    return PERMISSIONS.every(required =>
      granted.some(
        permission =>
          permission.accessType ===
          required.accessType &&
          permission.recordType ===
          required.recordType,
      ),
    );
  }

  async getStatus() {
    try {
      await this.ensureInit();

      const hasPermissions =
        await this.hasPermissions();

      return {
        state: hasPermissions
          ? 'connected'
          : 'permissionRequired',
        source: this.source,
      } as any;
    } catch (err: any) {
      return {
        state: 'error',
        message:
          err?.message ?? String(err),
        source: this.source,
      } as any;
    }
  }

  async getSleep(
    range: TimeRange,
  ): Promise<SleepSummary[]> {
    try {
      await this.ensureInit();

      const result = await readRecords(
        'SleepSession',
        {
          timeRangeFilter: {
            operator: 'between',
            startTime: range.start,
            endTime: range.end,
          },
        },
      );

      return result.records.map(record => {
        const stages =
          record.stages ?? [];

        const sumStageMinutes = (
          stageType: number,
        ) =>
          stages
            .filter(
              stage =>
                stage.stage ===
                stageType,
            )
            .reduce(
              (sum, stage) =>
                sum +
                minutesBetween(
                  stage.startTime,
                  stage.endTime,
                ),
              0,
            );

        return {
          source: this.source,
          date: toLocalDateISO(
            record.endTime,
          ),
          startTime:
            record.startTime,
          endTime: record.endTime,
          durationMinutes:
            minutesBetween(
              record.startTime,
              record.endTime,
            ),
          stages: {
            deepMinutes:
              sumStageMinutes(
                SLEEP_STAGE.deep,
              ),
            remMinutes:
              sumStageMinutes(
                SLEEP_STAGE.rem,
              ),
            lightMinutes:
              sumStageMinutes(
                SLEEP_STAGE.light,
              ),
            awakeMinutes:
              sumStageMinutes(
                SLEEP_STAGE.awake,
              ),
          },
        } satisfies SleepSummary;
      });
    } catch (err) {
      console.warn(
        '[HealthConnectAdapter] getSleep failed',
        err,
      );

      return [];
    }
  }

  async getBloodPressure(
    range: TimeRange,
  ): Promise<BloodPressureReading[]> {
    try {
      await this.ensureInit();

      const result = await readRecords(
        'BloodPressure',
        {
          timeRangeFilter: {
            operator: 'between',
            startTime: range.start,
            endTime: range.end,
          },
          ascendingOrder: true,
        },
      );

      console.log(
        '[HealthConnectAdapter] Blood pressure records',
        JSON.stringify(
          result.records,
          null,
          2,
        ),
      );

      return result.records.flatMap(
        record => {
          const systolic =
            getPressureInMmHg(
              record.systolic,
            );

          const diastolic =
            getPressureInMmHg(
              record.diastolic,
            );

          const recordedAt =
            record.time;

          if (
            systolic === null ||
            diastolic === null ||
            !recordedAt ||
            Number.isNaN(
              new Date(
                recordedAt,
              ).getTime(),
            )
          ) {
            return [];
          }

          return [
            {
              systolic:
                Math.round(
                  systolic * 10,
                ) / 10,
              diastolic:
                Math.round(
                  diastolic * 10,
                ) / 10,
              recordedAt,
              sourceName:
                record.metadata
                  ?.dataOrigin,
            } satisfies BloodPressureReading,
          ];
        },
      );
    } catch (err) {
      console.warn(
        '[HealthConnectAdapter] getBloodPressure failed',
        err,
      );

      return [];
    }
  }

  async getHRV(
    _range: TimeRange,
  ): Promise<HRVSummary[]> {
    return [];
  }

  async getDailyActivity(
    range: TimeRange,
  ): Promise<DailyActivity[]> {
    try {
      await this.ensureInit();

      const result = await readRecords(
        'Steps',
        {
          timeRangeFilter: {
            operator: 'between',
            startTime: range.start,
            endTime: range.end,
          },
        },
      );

      const stepsByDay =
        new Map<string, number>();

      for (const record of result.records) {
        const date =
          toLocalDateISO(
            record.endTime,
          );

        stepsByDay.set(
          date,
          (stepsByDay.get(date) ??
            0) + record.count,
        );
      }

      return [
        ...stepsByDay.entries(),
      ].map(
        ([date, steps]) =>
          ({
            source: this.source,
            date,
            steps,
          }) satisfies DailyActivity,
      );
    } catch (err) {
      console.warn(
        '[HealthConnectAdapter] getDailyActivity failed',
        err,
      );

      return [];
    }
  }

  async getEnergySignal(): Promise<
    any[]
  > {
    return [];
  }
}

export default HealthConnectAdapter;