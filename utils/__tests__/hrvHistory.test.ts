import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { getHRVHistory } from '../hrvHistory';

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
