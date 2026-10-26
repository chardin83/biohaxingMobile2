import { rememberDeletedMetric } from '@/app/context/storage/metrics/deletedMetricStorage';

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

it('does not import a deleted Health measurement again, even when its value changes', async () => {
  await rememberDeletedMetric({ metricId: 'hrv_sdnn', value: 40, unit: 'ms', recordedAt: '2026-10-22T00:00:00Z', origin: 'healthkit' });
  const upsert = jest.fn();
  await syncWearableMetricsToStorage(createAdapter([{ source: 'healthkit', date: '2026-10-22', sdnnMs: 55 }]), upsert);
  expect(upsert).toHaveBeenCalledWith([]);
});

it('persists the original source and record ID for each HRV sample', async () => {
  const upsert = jest.fn();
  await syncWearableMetricsToStorage(createAdapter([
    { source: 'healthconnect', date: '2026-10-12', recordedAt: '2026-10-12T12:00:00Z', rmssdMs: 40, sourceId: 'app-a', sourceRecordId: 'first' },
    { source: 'healthconnect', date: '2026-10-12', recordedAt: '2026-10-12T12:00:00Z', rmssdMs: 50, sourceId: 'app-a', sourceRecordId: 'second' },
  ]), upsert);
  expect(upsert.mock.calls[0][0]).toEqual([
    expect.objectContaining({ origin: 'healthconnect', sourceId: 'app-a', sourceRecordId: 'first', provenanceVersion: 1 }),
    expect.objectContaining({ origin: 'healthconnect', sourceId: 'app-a', sourceRecordId: 'second', provenanceVersion: 1 }),
  ]);
});

it('blocks only the deleted original record while preserving another source at the same time', async () => {
  await rememberDeletedMetric({ metricId: 'hrv_rmssd', origin: 'healthconnect', sourceId: 'app-a', sourceRecordId: 'blocked', unit: 'ms', value: 40, recordedAt: '2026-10-13T12:00:00Z' });
  const upsert = jest.fn();
  await syncWearableMetricsToStorage(createAdapter([
    { source: 'healthconnect', date: '2026-10-13', recordedAt: '2026-10-13T12:05:00Z', rmssdMs: 45, sourceId: 'app-a', sourceRecordId: 'blocked' },
    { source: 'healthconnect', date: '2026-10-13', recordedAt: '2026-10-13T12:00:00Z', rmssdMs: 50, sourceId: 'app-b', sourceRecordId: 'keep' },
  ]), upsert);
  expect(upsert.mock.calls[0][0]).toEqual([expect.objectContaining({ sourceId: 'app-b', sourceRecordId: 'keep' })]);
});

it('syncs workouts to the training log without a target and derives active minutes there', async () => {
  const adapter = createAdapter([]);
  jest.mocked(adapter.getDailyActivity).mockResolvedValue([{
    source: 'healthconnect', date: '2026-10-20', activeMinutes: 60,
    workouts: [{ source: 'healthconnect', sourceRecordId: 'session-1', sourceId: 'com.garmin.connect', startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T11:00:00Z', activityType: 'running' }],
  }]);
  const metrics = jest.fn();
  const training = jest.fn();
  await syncWearableMetricsToStorage(adapter, metrics, 30, training);
  expect(training).toHaveBeenCalledWith([expect.objectContaining({ origin: 'healthconnect', sourceRecordId: 'session-1', durationMinutes: 60, activityType: 'running' })]);
  expect(metrics.mock.calls[0][0].some((entry: { metricId: string }) => entry.metricId === 'active_minutes')).toBe(false);
});
