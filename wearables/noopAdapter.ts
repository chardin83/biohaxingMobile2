import { AdapterStatus, DailyActivity, EnergySignal, HRVSummary, SleepSummary, TimeRange, WearableAdapter } from './types';

export class NoopAdapter implements WearableAdapter {
  source = 'none' as const;

  async getStatus(): Promise<AdapterStatus> {
    return { state: 'disconnected', source: this.source };
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
}