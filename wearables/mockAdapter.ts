import {
  AdapterStatus,
  DailyActivity,
  EnergySignal,
  HRVSummary,
  SleepSummary,
  TimeRange,
  WearableAdapter,
} from './types';

function dateKeysBetween(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const out: string[] = [];
  const d = new Date(start);

  while (d <= end) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out.push(`${yyyy}-${mm}-${dd}`);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export class MockAdapter implements WearableAdapter {
  source = 'mock' as const;

  async getStatus(): Promise<AdapterStatus> {
    return { state: 'connected', source: 'mock' };
  }

  async getSleep(range: TimeRange): Promise<SleepSummary[]> {
    return dateKeysBetween(range.start, range.end).map((date, i) => ({
      source: 'mock',
      date,
      durationMinutes: 390 + (i % 3) * 25, // 6h30..7h20
      efficiencyPct: 80 + (i % 5),
      startTime: `23:38`,
      stages: { deepMinutes: 70, remMinutes: 90, lightMinutes: 210, awakeMinutes: 20 },
    }));
  }

  async getHRV(range: TimeRange): Promise<HRVSummary[]> {
    return dateKeysBetween(range.start, range.end).map((date, i) => ({
      source: 'mock',
      date,
      rmssdMs: 45 + (i % 6) * 3,
      avgRestingHrBpm: 55 + (i % 4),
    }));
  }

  async getDailyActivity(range: TimeRange): Promise<DailyActivity[]> {
    return dateKeysBetween(range.start, range.end).map((date, i) => ({
      source: 'mock',
      date,
      steps: 6000 + i * 350,
      activeMinutes: 25 + (i % 4) * 10,
    }));
  }

  async getEnergySignal(range: TimeRange): Promise<EnergySignal[]> {
    return dateKeysBetween(range.start, range.end).map((date, i) => ({
      source: 'mock',
      date,
      bodyBatteryLevel: 55 + (i % 10) * 3, // looks like Garmin-ish
    }));
  }
}
