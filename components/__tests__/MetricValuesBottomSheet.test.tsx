import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { MetricValuesBottomSheet } from '../sections/metrics/MetricValuesBottomSheet';

const mockGetHistory = jest.fn(() =>
  Array.from({ length: 2016 }, (_, index) => ({
    metricId: 'hrv_rmssd',
    value: 40,
    unit: 'ms',
    recordedAt: new Date(index * 300000).toISOString(),
  }))
);
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ getMetricHistory: mockGetHistory }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('../RegisterMetricBottomSheet', () => ({ RegisterMetricBottomSheet: () => null }));
jest.mock('../sections/metrics/SleepBatchBottomSheet', () => ({ SleepBatchBottomSheet: () => null }));
jest.mock('react-native-paper', () => ({ Portal: ({ children }: any) => children }));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: mockReact.forwardRef(({ children, onChange, onAnimate }: any, _ref: any) =>
      mockReact.createElement(View, { testID: 'sheet', onChange, onAnimate }, children)
    ),
    BottomSheetView: View,
  };
});
jest.mock('../sections/metrics/MetricValuesTableSection', () => ({
  MetricValuesTableSection: ({ entries }: any) => {
    const mockReact = require('react');
    const { Text } = require('react-native');
    return mockReact.createElement(Text, null, `Rows: ${entries.length}`);
  },
}));

it('shows a spinner before preparing the values sheet and hides rows when closed', async () => {
  mockGetHistory.mockClear();
  const { getByTestId, getByText, queryByText, UNSAFE_getByType, UNSAFE_queryByType } = render(
    <MetricValuesBottomSheet bottomSheetRef={React.createRef()} metricId="hrv_rmssd" />
  );
  expect(mockGetHistory).not.toHaveBeenCalled();
  expect(queryByText('Rows: 2016')).toBeNull();
  fireEvent(getByTestId('sheet'), 'animate', -1, 1);
  const { ActivityIndicator } = require('react-native');
  expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  expect(mockGetHistory).not.toHaveBeenCalled();
  fireEvent(getByTestId('sheet'), 'change', 1);
  await waitFor(() => expect(getByText('Rows: 2016')).toBeTruthy());
  expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
  fireEvent(getByTestId('sheet'), 'change', -1);
  expect(queryByText('Rows: 2016')).toBeNull();
});
