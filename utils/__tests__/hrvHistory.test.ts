import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { buildHRVDailyTrend, getHRVHistory } from '../hrvHistory';

const entry = (metricId: MetricEntry['metricId'], recordedAt: string, value: number): MetricEntry => ({ metricId, recordedAt, value, unit: 'ms' });

describe('getHRVHistory', () => {
  it.each(['hrv_rmssd', 'hrv_sdnn'] as const)('reads %s when it is the available format', metricId => {
    const entries = [entry(metricId, '2026-10-05', 45)];
    expect(getHRVHistory(id => (id === metricId ? entries : []))).toEqual({ metricId, entries });
  });

  it('uses the newest format without merging the other series', () => {
    const rmssd = [entry('hrv_rmssd', '2026-10-03', 40), entry('hrv_rmssd', '2026-10-04', 45)];
    const sdnn = [entry('hrv_sdnn', '2026-10-05', 70)];
    expect(getHRVHistory(id => (id === 'hrv_rmssd' ? rmssd : sdnn))).toEqual({ metricId: 'hrv_sdnn', entries: sdnn });
  });

  it('prefers RMSSD on equal dates and does not read untyped legacy HRV', () => {
    const getHistory = jest.fn(id => (id === 'hrv_rmssd' ? [entry('hrv_rmssd', '2026-10-05', 45)] : [entry('hrv_sdnn', '2026-10-05', 70)]));
    expect(getHRVHistory(getHistory).metricId).toBe('hrv_rmssd');
    expect(getHistory).not.toHaveBeenCalledWith('hrv');
  });
});

describe('HRV daily averages', () => {
  it.each(['hrv_rmssd', 'hrv_sdnn'] as const)('averages all measurements for each local day for %s', metricId => {
    const samples = [
      entry(metricId, new Date(2026, 9, 6, 8, 0).toISOString(), 70),
      entry(metricId, new Date(2026, 9, 5, 8, 0).toISOString(), 40),
      entry(metricId, new Date(2026, 9, 5, 8, 5).toISOString(), 80),
      entry(metricId, new Date(2026, 9, 5, 8, 10).toISOString(), 30),
    ];
    expect(buildHRVDailyTrend(samples)).toEqual([
      { date: '2026-10-05', value: 50 },
      { date: '2026-10-06', value: 70 },
    ]);
    expect(samples).toHaveLength(4);
  });

  it('groups late-night and early-morning measurements by local date', () => {
    const samples = [
      entry('hrv_rmssd', new Date(2026, 9, 5, 0, 5).toISOString(), 40),
      entry('hrv_rmssd', new Date(2026, 9, 5, 23, 55).toISOString(), 60),
      entry('hrv_rmssd', new Date(2026, 9, 6, 0, 5).toISOString(), 90),
    ];
    expect(buildHRVDailyTrend(samples)).toEqual([
      { date: '2026-10-05', value: 50 },
      { date: '2026-10-06', value: 90 },
    ]);
  });

  it('skips invalid values and dates', () => {
    expect(buildHRVDailyTrend([entry('hrv_rmssd', '2026-10-05T12:00:00Z', NaN), entry('hrv_rmssd', 'invalid', 40)])).toEqual([]);
  });
});
