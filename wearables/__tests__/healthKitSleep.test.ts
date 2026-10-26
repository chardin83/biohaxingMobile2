import { HealthKitAdapter } from '../healthkitAdapter';

jest.mock('@/app/context/storage/userProfile/userProfileStore', () => ({ getUserProfile: jest.fn().mockResolvedValue({}) }));

jest.mock('react-native-health', () => ({ initHealthKit: (_options: unknown, callback: (error: null) => void) => callback(null), getSleepSamples: jest.fn() }));

it('imports one consistent sleep timeline instead of mixing overlapping watches', async () => {
  const health = require('react-native-health');
  const raw = [
    { id: 'bed', sourceId: 'com.garmin.connect', value: 'INBED', startDate: '2026-10-20T00:00:00Z', endDate: '2026-10-20T09:00:00Z' },
    { id: 'summary', sourceId: 'com.garmin.connect', value: 'ASLEEP', startDate: '2026-10-20T00:00:00Z', endDate: '2026-10-20T08:00:00Z' },
    { id: 'deep', sourceId: 'com.ouraring.oura', value: 'DEEP', startDate: '2026-10-20T00:00:00Z', endDate: '2026-10-20T02:00:00Z' },
    { id: 'rem', sourceId: 'com.ouraring.oura', value: 'REM', startDate: '2026-10-20T02:00:00Z', endDate: '2026-10-20T04:00:00Z' },
    { id: 'light', sourceId: 'com.ouraring.oura', value: 'CORE', startDate: '2026-10-20T04:00:00Z', endDate: '2026-10-20T07:00:00Z' },
    { id: 'awake', sourceId: 'com.ouraring.oura', value: 'AWAKE', startDate: '2026-10-20T07:00:00Z', endDate: '2026-10-20T08:00:00Z' },
  ];
  health.getSleepSamples.mockImplementation((_options: unknown, callback: (error: null, result: unknown[]) => void) => callback(null, raw));
  const result = await new HealthKitAdapter().getSleep({ start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ durationMinutes: 420, sourceId: 'com.ouraring.oura', stages: { deepMinutes: 120, remMinutes: 120, lightMinutes: 180, awakeMinutes: 60 } });
  expect(result[0].sourceRecords?.map(record => record.sourceRecordId)).toEqual(['deep', 'rem', 'light', 'awake']);
});

it('uses Garmin activity before an overlapping Oura workout', async () => {
  const adapter = new HealthKitAdapter();
  jest.spyOn(adapter as any, 'getDailyStepCounts').mockResolvedValue([]);
  jest.spyOn(adapter as any, 'getHeartRateSamples').mockResolvedValue([]);
  jest.spyOn(adapter as any, 'getWorkoutSamples').mockResolvedValue([
    { id: 'oura', sourceId: 'com.ouraring.oura', startDate: '2026-10-20T10:00:00Z', endDate: '2026-10-20T11:30:00Z' },
    { id: 'garmin', sourceId: 'com.garmin.connect', startDate: '2026-10-20T10:00:00Z', endDate: '2026-10-20T11:00:00Z' },
  ]);
  const result = await adapter.getDailyActivity({ start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(result[0]).toMatchObject({ activeMinutes: 60, activeProvenance: { sourceId: 'com.garmin.connect' } });
});

it('exposes the original workout and converts the native distance in miles to kilometres', async () => {
  const adapter = new HealthKitAdapter();
  jest.spyOn(adapter as any, 'getDailyStepCounts').mockResolvedValue([]);
  jest.spyOn(adapter as any, 'getHeartRateSamples').mockResolvedValue([]);
  jest.spyOn(adapter as any, 'getWorkoutSamples').mockResolvedValue([
    { id: 'run', sourceId: 'com.garmin.connect', sourceName: 'Garmin', activityName: 'Running', distance: 5, start: '2026-10-20T10:00:00Z', end: '2026-10-20T11:00:00Z' },
  ]);
  const result = await adapter.getDailyActivity({ start: '2026-10-20T00:00:00Z', end: '2026-10-21T00:00:00Z' });
  expect(result[0].workouts?.[0]).toMatchObject({ source: 'healthkit', sourceRecordId: 'run', sourceName: 'Garmin', activityType: 'running', startTime: '2026-10-20T10:00:00Z', distanceKm: 8.04672 });
});
