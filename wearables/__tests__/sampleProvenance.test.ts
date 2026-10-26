import { HealthKitAdapter } from '../healthkitAdapter';
import { aggregateProvenance, healthConnectProvenance, healthKitProvenance } from '../sampleProvenance';

it('keeps the HealthKit source app and sample UUID separate', () => {
  expect(healthKitProvenance({ id: 'sample-1', sourceId: 'com.garmin.connect', sourceName: 'Garmin Connect' })).toMatchObject({
    sourceRecordId: 'sample-1', sourceId: 'com.garmin.connect', sourceName: 'Garmin Connect',
  });
});

it('uses Health Connect dataOrigin as an app ID without inventing a display name', () => {
  const result = healthConnectProvenance({ metadata: { id: 'record-1', dataOrigin: 'com.samsung.health' } });
  expect(result.sourceId).toBe('com.samsung.health');
  expect(result.sourceRecordId).toBe('record-1');
  expect(result.sourceName).toBeUndefined();
  expect(healthKitProvenance({}).sourceName).toBeUndefined();
});

it('retains mixed sources and record IDs for daily aggregates', () => {
  const first = healthKitProvenance({ id: 'a', sourceId: 'garmin', sourceName: 'Garmin' });
  const second = healthKitProvenance({ id: 'b', sourceId: 'apple', sourceName: 'Watch' });
  const result = aggregateProvenance([first, second, first]);
  expect(result.sourceName).toBeUndefined();
  expect(result.sourceId).toBeUndefined();
  expect(result.sourceRecordId).toBeUndefined();
  expect(result.isAggregate).toBe(true);
  expect(result.sourceRecords).toHaveLength(2);
});

it('keeps one preferred original source for a HealthKit HRV daily average', () => {
  const adapter = new HealthKitAdapter();
  const results = (adapter as any).toHRVSummaries([
    { id: 'a', sourceId: 'com.garmin.connect', sourceName: 'Watch A', startDate: '2026-10-26T12:00:00Z', value: 0.04 },
    { id: 'b', sourceId: 'com.apple.health', sourceName: 'Watch B', startDate: '2026-10-26T13:00:00Z', value: 0.06 },
  ]);
  expect(results[0].sdnnMs).toBe(60);
  expect(results[0].sourceName).toBe('Watch B');
  expect(results[0].sourceRecords).toEqual([
    { sourceRecordId: 'b', sourceId: 'com.apple.health', sourceName: 'Watch B' },
  ]);
});
