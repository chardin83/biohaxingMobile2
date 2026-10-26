import { aggregateRecord, readRecords } from 'react-native-health-connect';

import { HealthConnectAdapter } from '../healthConnectAdapter';

jest.mock('react-native-health-connect', () => ({
  SdkAvailabilityStatus: { SDK_AVAILABLE: 3 },
  getSdkStatus: jest.fn().mockResolvedValue(3),
  initialize: jest.fn().mockResolvedValue(true),
  readRecords: jest.fn(),
  aggregateRecord: jest.fn(),
}));
jest.mock('@/app/context/storage/userProfile/userProfileStore', () => ({ getUserProfile: jest.fn() }));

describe('Health Connect HRV import', () => {
  it('reads subsequent pages and retains all sample timestamps', async () => {
    const read = jest.mocked(readRecords);
    read.mockResolvedValueOnce({
      records: [{ time: '2026-10-05T10:00:00+02:00', heartRateVariabilityMillis: 40, metadata: { id: 'first', dataOrigin: 'app-a' } }] as any,
      pageToken: 'next-page',
    });
    read.mockResolvedValueOnce({
      records: [{ time: '2026-10-05T10:05:00+02:00', heartRateVariabilityMillis: 45, metadata: { id: 'second', dataOrigin: 'app-b' } }] as any,
    });
    const range = { start: '2026-10-05T00:00:00Z', end: '2026-10-06T00:00:00Z' };

    const samples = await new HealthConnectAdapter().getHRV(range);

    expect(read).toHaveBeenCalledTimes(2);
    expect(read).toHaveBeenNthCalledWith(2, 'HeartRateVariabilityRmssd', expect.objectContaining({ pageToken: 'next-page', ascendingOrder: true }));
    expect(samples).toEqual([
      expect.objectContaining({ recordedAt: '2026-10-05T08:00:00.000Z', rmssdMs: 40, sourceId: 'app-a', sourceRecordId: 'first' }),
      expect.objectContaining({ recordedAt: '2026-10-05T08:05:00.000Z', rmssdMs: 45, sourceId: 'app-b', sourceRecordId: 'second' }),
    ]);
  });
});

it.each([
  { method: 'getSleep', record: { startTime: '2026-10-05T00:00:00Z', endTime: '2026-10-05T08:00:00Z', stages: [] } },
  { method: 'getRestingHeartRate', record: { time: '2026-10-05T08:00:00Z', beatsPerMinute: 55 } },
  { method: 'getVO2Max', record: { time: '2026-10-05T08:00:00Z', vo2MillilitersPerMinuteKilogram: 45 } },
  { method: 'getBloodPressure', record: { time: '2026-10-05T08:00:00Z', systolic: 120, diastolic: 80 } },
] as const)('retains per-record metadata for $method', async ({ method, record }) => {
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [{ ...record, metadata: { id: 'original-id', dataOrigin: 'original-app' } }] } as any);
  const result = await new HealthConnectAdapter()[method]({ start: '2026-10-05T00:00:00Z', end: '2026-10-06T00:00:00Z' });
  expect(result[0]).toMatchObject(method === 'getSleep'
    ? { sourceId: 'original-app', sourceRecords: [{ sourceRecordId: 'original-id', sourceId: 'original-app' }] }
    : { sourceRecordId: 'original-id', sourceId: 'original-app' });
});

it('uses the Health Connect selected source for overlapping sleep sessions', async () => {
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [
    { startTime: '2026-10-20T00:00:00Z', endTime: '2026-10-20T08:00:00Z', metadata: { id: 'a', dataOrigin: 'preferred' }, stages: [] },
    { startTime: '2026-10-20T00:00:00Z', endTime: '2026-10-20T08:00:00Z', metadata: { id: 'b', dataOrigin: 'other' }, stages: [{ startTime: '2026-10-20T00:00:00Z', endTime: '2026-10-20T08:00:00Z', stage: 5 }] },
  ] } as any);
  jest.mocked(aggregateRecord).mockResolvedValueOnce({ SLEEP_DURATION_TOTAL: 28800, dataOrigins: ['preferred'] } as any);
  const result = await new HealthConnectAdapter().getSleep({ start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ sourceId: 'preferred', durationMinutes: 480, normalizationVersion: 'sleep-v1' });
  expect(result[0].stages).toBeUndefined();
});

it('reads all sleep pages and sums separate sessions for one day', async () => {
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [{ startTime: '2026-10-21T00:00:00Z', endTime: '2026-10-21T08:00:00Z', metadata: { id: 'night', dataOrigin: 'app' } }], pageToken: 'sleep-next' } as any);
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [{ startTime: '2026-10-21T14:00:00Z', endTime: '2026-10-21T15:00:00Z', metadata: { id: 'nap', dataOrigin: 'app' } }] } as any);
  const result = await new HealthConnectAdapter().getSleep({ start: '2026-10-21T00:00:00Z', end: '2026-10-22T00:00:00Z' });
  expect(result[0].durationMinutes).toBe(540);
  expect(result[0].sourceRecords).toHaveLength(2);
});

it('uses the activity source priority before summing workouts', async () => {
  const { getUserProfile } = require('@/app/context/storage/userProfile/userProfileStore');
  getUserProfile.mockResolvedValue({});
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [] } as any);
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [
    { startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T11:30:00Z', metadata: { id: 'oura-session', dataOrigin: 'com.ouraring.oura' } },
    { startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T11:00:00Z', metadata: { id: 'garmin-session', dataOrigin: 'com.garmin.connect' } },
  ] } as any);
  const result = await new HealthConnectAdapter().getDailyActivity({ start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(result[0]).toMatchObject({ activeMinutes: 60, activeProvenance: { sourceId: 'com.garmin.connect' } });
});

it('imports workout sessions from all pages with original source and activity type', async () => {
  const { getUserProfile } = require('@/app/context/storage/userProfile/userProfileStore');
  getUserProfile.mockResolvedValue({});
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [] } as any);
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [{ exerciseType: 56, startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T11:00:00Z', metadata: { id: 'morning', dataOrigin: 'com.garmin.connect' } }], pageToken: 'workouts-next' } as any);
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [{ exerciseType: 79, startTime: '2026-10-20T16:00:00Z', endTime: '2026-10-20T16:30:00Z', metadata: { id: 'evening', dataOrigin: 'com.garmin.connect' } }] } as any);
  const result = await new HealthConnectAdapter().getDailyActivity({ start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(result[0].workouts).toEqual([
    expect.objectContaining({ source: 'healthconnect', sourceRecordId: 'morning', sourceId: 'com.garmin.connect', activityType: 'running' }),
    expect.objectContaining({ sourceRecordId: 'evening', activityType: 'walking' }),
  ]);
  expect(result[0].activeMinutes).toBe(90);
  expect(readRecords).toHaveBeenLastCalledWith('ExerciseSession', expect.objectContaining({ pageToken: 'workouts-next' }));
});

it('attaches measured intensity to the Health Connect workout', async () => {
  const { getUserProfile } = require('@/app/context/storage/userProfile/userProfileStore');
  getUserProfile.mockResolvedValue({ maxHeartRate: 200 });
  const adapter = new HealthConnectAdapter();
  jest.mocked(readRecords).mockResolvedValueOnce({ records: [] } as any);
  jest.spyOn(adapter as any, 'getExerciseSessions').mockResolvedValue([
    { exerciseType: 56, startTime: '2026-10-20T10:00:00Z', endTime: '2026-10-20T11:00:00Z', metadata: { id: 'pulse-run', dataOrigin: 'com.garmin.connect' } },
  ]);
  jest.spyOn(adapter as any, 'getHeartRateSamples').mockResolvedValue([
    { time: Date.parse('2026-10-20T10:00:00Z'), value: 150, provenance: { sourceId: 'com.garmin.connect' } },
    { time: Date.parse('2026-10-20T10:10:00Z'), value: 150, provenance: { sourceId: 'com.garmin.connect' } },
  ]);
  const result = await adapter.getDailyActivity({ start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(result[0].workouts?.[0]).toMatchObject({ intensityMinutes: 10, intensityIntervals: [{ startTime: '2026-10-20T10:00:00.000Z', endTime: '2026-10-20T10:10:00.000Z' }] });
});
