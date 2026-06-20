import {
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  Permission,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

import { HRVSummary, SleepSummary, TimeRange, WearableAdapter } from './types';

const PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
] as const;

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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function minutesBetween(start: string, end: string) {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

export class HealthConnectAdapter implements WearableAdapter {
  source = 'healthconnect' as const;
  private initialized = false;

  private async ensureInit() {
    if (this.initialized) return;

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

    return granted.length > 0;
  }

  async hasPermissions() {
    await this.ensureInit();

    const granted = await getGrantedPermissions();

    return granted.some(
      permission =>
        permission.accessType === 'read' &&
        permission.recordType === 'SleepSession'
    );
  }

  async getStatus() {
    try {
      await this.ensureInit();
      const hasPermissions = await this.hasPermissions();

      return {
        state: hasPermissions ? 'connected' : 'permissionRequired',
        source: this.source,
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

    const permissions = await getGrantedPermissions();
console.log('Permissions:', permissions);

    const result = await readRecords('SleepSession', {
      timeRangeFilter: {
        operator: 'between',
        startTime: range.start,
        endTime: range.end,
      },
    });

    console.log('Sleep records:', JSON.stringify(result.records, null, 2));
    

    return result.records.map(record => {
      const stages = record.stages ?? [];

      const sumStageMinutes = (stageType: number) =>
        stages
          .filter(stage => stage.stage === stageType)
          .reduce(
            (sum, stage) =>
              sum + minutesBetween(stage.startTime, stage.endTime),
            0
          );

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
      };
    });
  } catch (err) {
    console.warn('[HealthConnectAdapter] getSleep failed', err);
    return [];
  }
}

  async getHRV(_range: TimeRange): Promise<HRVSummary[]> {
    return [];
  }

  async getDailyActivity(): Promise<any[]> {
    return [];
  }

  async getEnergySignal(): Promise<any[]> {
    return [];
  }
}

export default HealthConnectAdapter;