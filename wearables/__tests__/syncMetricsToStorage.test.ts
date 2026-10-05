import { syncWearableMetricsToStorage } from '../syncMetricsToStorage';
import { type HRVSummary, type WearableAdapter } from '../types';

jest.mock('@/app/context/storage/userProfile/userProfileStore', () => ({
  getUserProfile: jest.fn().mockResolvedValue({}),
}));

const createAdapter = (hrvs: HRVSummary[]): WearableAdapter => ({
  source: hrvs[0]?.source ?? 'healthconnect',
  hasPermission: jest.fn().mockResolvedValue(true),
  getStatus: jest.fn().mockResolvedValue({ state: 'connected', source: 'healthconnect' }),
  getSleep: jest.fn().mockResolvedValue([]),
  getVO2Max: jest.fn().mockResolvedValue([]),
  getDailyActivity: jest.fn().mockResolvedValue([]),
  getHRV: jest.fn().mockResolvedValue(hrvs),
  getRestingHeartRate: jest.fn().mockResolvedValue([]),
  getBloodPressure: jest.fn().mockResolvedValue([]),
});

describe('HRV metric sync', () => {
  it.each([
    { source: 'healthconnect', date: '2026-10-05', rmssdMs: 42 },
    { source: 'healthkit', date: '2026-10-05', sdnnMs: 55 },
  ] satisfies HRVSummary[])('stores HRV from $source', async summary => {
    const upsert = jest.fn();

    await syncWearableMetricsToStorage(createAdapter([summary]), upsert);

    expect(upsert).toHaveBeenCalledWith([
      expect.objectContaining({
        metricId: summary.rmssdMs !== undefined ? 'hrv_rmssd' : 'hrv_sdnn',
        value: summary.rmssdMs ?? summary.sdnnMs,
        unit: 'ms',
        recordedAt: '2026-10-05T00:00:00.000Z',
      }),
    ]);
  });

  it('stores both formats separately when both are provided', async () => {
    const upsert = jest.fn();
    await syncWearableMetricsToStorage(createAdapter([{ source: 'mock', date: '2026-10-05', rmssdMs: 42, sdnnMs: 55 }]), upsert);
    expect(upsert).toHaveBeenCalledWith([
      expect.objectContaining({ metricId: 'hrv_rmssd', value: 42 }),
      expect.objectContaining({ metricId: 'hrv_sdnn', value: 55 }),
    ]);
  });

  it('preserves every five-minute HRV measurement and its original timestamp', async () => {
    const upsert = jest.fn();
    const samples: HRVSummary[] = Array.from({ length: 288 }, (_, index) => ({
      source: 'healthconnect',
      date: '2026-10-05',
      recordedAt: new Date(Date.UTC(2026, 9, 5, 0, index * 5)).toISOString(),
      rmssdMs: 40 + index,
    }));
    await syncWearableMetricsToStorage(createAdapter(samples), upsert);
    const entries = upsert.mock.calls[0][0];
    expect(entries).toHaveLength(288);
    expect(new Set(entries.map((entry: { recordedAt: string }) => entry.recordedAt)).size).toBe(288);
    expect(entries[0]).toEqual(expect.objectContaining({ metricId: 'hrv_rmssd', recordedAt: samples[0].recordedAt, value: 40 }));
    expect(entries[287]).toEqual(expect.objectContaining({ recordedAt: samples[287].recordedAt, value: 327 }));
  });

  it('skips missing and non-finite HRV values', async () => {
    const upsert = jest.fn();
    const summaries: HRVSummary[] = [
      { source: 'healthconnect', date: '2026-10-05' },
      { source: 'healthconnect', date: '2026-10-05', rmssdMs: NaN },
      { source: 'healthkit', date: '2026-10-05', sdnnMs: Infinity },
    ];

    await syncWearableMetricsToStorage(createAdapter(summaries), upsert);

    expect(upsert).toHaveBeenCalledWith([]);
  });
});
