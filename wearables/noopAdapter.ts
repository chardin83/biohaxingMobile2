import { AdapterStatus, BloodPressureReading, DailyActivity, EnergySignal, HRVSummary, SleepSummary, TimeRange, WearableAdapter } from './types';

export class NoopAdapter implements WearableAdapter {
  readonly source = 'none' as const;

  connect(): Promise<void> {
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  async getStatus(): Promise<AdapterStatus> {
    return {
      state: 'disconnected',
      source: this.source,
    };
  }

  async getSleep(_range: TimeRange): Promise<SleepSummary[]> {
    return [];
  }

  async getHRV(_range: TimeRange): Promise<HRVSummary[]> {
    return [];
  }

  async getDailyActivity(_range: TimeRange): Promise<DailyActivity[]> {
    return [];
  }

  async getEnergySignal(_range: TimeRange): Promise<EnergySignal[]> {
    return [];
  }

  async getBloodPressure(_range: TimeRange): Promise<BloodPressureReading[]> {
    return [];
  }
}
