import { AdapterStatus, DailyActivity, EnergySignal, HRVSummary, SleepSummary, TimeRange, WearableAdapter } from './types';

function enumerateDates(range: TimeRange): string[] {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const dates: string[] = [];

  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }

  return dates.reverse();
}

export class MockAdapter implements WearableAdapter {
  source = 'mock' as const;

  async getStatus(): Promise<AdapterStatus> {
    return { state: 'connected', source: this.source };
  }

  async getSleep(range: TimeRange): Promise<SleepSummary[]> {
    return enumerateDates(range).map((date, index) => ({
      source: this.source,
      date,
      durationMinutes: 390 + (index % 3) * 25,
      efficiencyPct: 82 + (index % 4) * 2,
      startTime: '22:45',
      endTime: '06:45',
      stages: {
        deepMinutes: 70 + (index % 3) * 10,
        remMinutes: 85 + (index % 2) * 12,
        lightMinutes: 220,
        awakeMinutes: 15,
      },
    }));
  }

  async getHRV(range: TimeRange): Promise<HRVSummary[]> {
    return enumerateDates(range).map((date, index) => ({
      source: this.source,
      date,
      rmssdMs: 45 + (index % 6) * 3,
      avgRestingHrBpm: 55 + (index % 4),
    }));
  }

  async getDailyActivity(range: TimeRange): Promise<DailyActivity[]> {
    return enumerateDates(range).map((date, index) => ({
      source: this.source,
      date,
      steps: 6000 + index * 350,
      activeMinutes: 35 + (index % 5) * 10,
      intensityMinutes: 12 + (index % 4) * 8,
    }));
  }

  async getEnergySignal(range: TimeRange): Promise<EnergySignal[]> {
    return enumerateDates(range).map((date, index) => ({
      source: this.source,
      date,
      bodyBatteryLevel: 55 + (index % 10) * 3,
    }));
  }
}