import { renderHook } from '@testing-library/react-native';

import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { useMetricConfig } from '@/components/metrics/metricChartConfig';

let mockEntries: MetricEntry[] = [];
const mockHistory = jest.fn((id: string) => mockEntries.filter(entry => entry.metricId === id));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ getMetricHistory: mockHistory }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { chart: { hrv: 'green' } } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

beforeEach(() => mockHistory.mockClear());

it.each(['hrv_rmssd', 'hrv_sdnn'] as const)('uses the explicit %s chart selector without querying a nonexistent metric', metricId => {
  mockEntries = [{ metricId, value: 45, unit: 'ms', recordedAt: new Date().toISOString() }];
  const { result } = renderHook(() => useMetricConfig({ metricId }));
  expect(result.current?.metricName).toBe(`metrics:${metricId}.name`);
  expect(result.current?.data).toEqual([expect.objectContaining({ value: 45 })]);
  expect(result.current?.unit).toBe('ms');
  expect(mockHistory).not.toHaveBeenCalledWith('hrv');
});

it('configures automatic GI history with a period average line', () => {
  mockEntries = [{ metricId: 'glycemic_index', value: 52, unit: 'index', recordedAt: new Date().toISOString() }];
  const { result } = renderHook(() => useMetricConfig({ metricId: 'glycemic_index' }));
  expect(result.current).toMatchObject({ unit: 'GI', showPeriodAverage: true, data: [expect.objectContaining({ value: 52 })] });
});
