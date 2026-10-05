import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';

import { MetricValuesTableSection } from '../sections/metrics/MetricValuesTableSection';

jest.mock('@gorhom/bottom-sheet', () => ({ BottomSheetFlatList: require('react-native').FlatList }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/AppButton', () => () => null);
jest.mock('../ui/SwipeableRow', () => ({
  SwipeableRow: ({ children }: any) => {
    const mockReact = require('react');
    const { View } = require('react-native');
    return mockReact.createElement(View, { testID: 'metric-row' }, children);
  },
}));

it('renders a bounded number of rows for a full week of five-minute HRV samples', () => {
  const entries: MetricEntry[] = Array.from({ length: 2016 }, (_, index) => ({
    metricId: 'hrv_rmssd',
    recordedAt: new Date(index * 300000).toISOString(),
    value: 40,
    unit: 'ms',
  }));
  const { getAllByTestId } = render(
    <MetricValuesTableSection
      virtualized
      entries={entries}
      colors={{}}
      emptyText="Empty"
      onAddPress={jest.fn()}
      registeredValuesTitle="Values"
      dateLabel="Date"
      valueLabel="Value"
      notesLabel="Notes"
    />
  );
  expect(getAllByTestId('metric-row').length).toBeGreaterThan(0);
  expect(getAllByTestId('metric-row').length).toBeLessThan(50);
});

it('shows the footer spinner while more rows are pending and removes it after the final batch', async () => {
  const { FlatList, ActivityIndicator } = require('react-native');
  const entries: MetricEntry[] = Array.from({ length: 130 }, (_, index) => ({
    metricId: 'hrv_rmssd',
    recordedAt: new Date(index * 300000).toISOString(),
    value: 40,
    unit: 'ms',
  }));
  const { UNSAFE_getByType, UNSAFE_queryByType } = render(
    <MetricValuesTableSection
      virtualized
      entries={entries}
      colors={{}}
      emptyText="Empty"
      onAddPress={jest.fn()}
      registeredValuesTitle="Values"
      dateLabel="Date"
      valueLabel="Value"
      notesLabel="Notes"
    />
  );
  expect(UNSAFE_getByType(FlatList).props.data).toHaveLength(60);
  expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  act(() => UNSAFE_getByType(FlatList).props.onEndReached());
  expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  await waitFor(() => expect(UNSAFE_getByType(FlatList).props.data).toHaveLength(120));
  act(() => UNSAFE_getByType(FlatList).props.onEndReached());
  await waitFor(() => expect(UNSAFE_getByType(FlatList).props.data).toHaveLength(130));
  expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
});

const tableProps = {
  colors: {},
  emptyText: 'Empty',
  onAddPress: jest.fn(),
  registeredValuesTitle: 'Values',
  dateLabel: 'Date',
  valueLabel: 'Value',
  notesLabel: 'Notes',
};

it.each([false, true])('shows local time for multiple measurements on one day (virtualized: %s)', virtualized => {
  const entries: MetricEntry[] = [
    { metricId: 'hrv_rmssd', recordedAt: new Date(2026, 9, 5, 8, 0).toISOString(), value: 40, unit: 'ms' },
    { metricId: 'hrv_rmssd', recordedAt: new Date(2026, 9, 5, 8, 5).toISOString(), value: 45, unit: 'ms' },
  ];
  const { getByText } = render(<MetricValuesTableSection {...tableProps} virtualized={virtualized} entries={entries} />);
  expect(getByText('common:general.time')).toBeTruthy();
  expect(getByText('08:00')).toBeTruthy();
  expect(getByText('08:05')).toBeTruthy();
});

it('omits the time column when every day has only one measurement', () => {
  const entries: MetricEntry[] = [
    { metricId: 'hrv_rmssd', recordedAt: new Date(2026, 9, 5, 8, 0).toISOString(), value: 40, unit: 'ms' },
    { metricId: 'hrv_rmssd', recordedAt: new Date(2026, 9, 6, 8, 5).toISOString(), value: 45, unit: 'ms' },
  ];
  const { queryByText } = render(<MetricValuesTableSection {...tableProps} entries={entries} />);
  expect(queryByText('common:general.time')).toBeNull();
  expect(queryByText('08:00')).toBeNull();
});
