import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { HRVMetric } from '../metrics/HRVMetric';

let mockEntries: MetricEntry[] = [];
jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({ getMetricHistory: (id: string) => mockEntries.filter(entry => entry.metricId === id) }),
}));
jest.mock('@/wearables/wearableProvider', () => ({
  useWearable: () => ({ adapter: { hasPermission: () => Promise.resolve(true) } }),
}));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../metrics/MetricDataStatus', () => ({ MetricDataStatus: () => null }));

describe('HRVMetric', () => {
  it.each(['hrv_rmssd', 'hrv_sdnn'] as const)('displays %s', async metricId => {
    mockEntries = [{ metricId, value: 45, unit: 'ms', recordedAt: new Date().toISOString() }];
    const { getByText } = render(<HRVMetric />);
    await waitFor(() => expect(getByText('45')).toBeTruthy());
    expect(getByText(`metrics:${metricId}.shortName`)).toBeTruthy();
  });

  it('compares only values from the same format', async () => {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    mockEntries = [
      { metricId: 'hrv_rmssd', value: 40, unit: 'ms', recordedAt: yesterday },
      { metricId: 'hrv_sdnn', value: 100, unit: 'ms', recordedAt: yesterday },
      { metricId: 'hrv_rmssd', value: 60, unit: 'ms', recordedAt: today },
    ];
    const { getByText, queryByText } = render(<HRVMetric />);
    await waitFor(() => expect(getByText('+50%')).toBeTruthy());
    expect(queryByText('-40%')).toBeNull();
  });
});
