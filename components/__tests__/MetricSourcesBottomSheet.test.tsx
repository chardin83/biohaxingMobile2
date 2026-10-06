import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { MetricSourcesBottomSheet } from '../sections/metrics/MetricSourcesBottomSheet';

const mockClose = jest.fn();
const mockOpenValues = jest.fn();
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('react-native-paper', () => ({ Portal: ({ children }: any) => children }));
jest.mock('../ui/SettingsCardLink', () => ({
  SettingsCardLink: ({ rows, showIcon }: any) => {
    const mockReact = require('react');
    const { Text, Pressable } = require('react-native');
    return rows.map((row: any) =>
      mockReact.createElement(
        Pressable,
        { key: row.key, onPress: row.onPress, testID: `link-${row.title}`, showIcon },
        mockReact.createElement(Text, null, row.title)
      )
    );
  },
}));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: mockReact.forwardRef(({ children, onChange }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ close: mockClose }));
      return mockReact.createElement(View, { testID: 'sources', onChange }, children);
    }),
    BottomSheetScrollView: View,
  };
});
jest.mock('../sections/metrics/MetricValuesBottomSheet', () => ({
  MetricValuesBottomSheet: ({ bottomSheetRef, metricId, metricName }: any) => {
    const mockReact = require('react');
    const { Text } = require('react-native');
    mockReact.useImperativeHandle(bottomSheetRef, () => ({ snapToIndex: mockOpenValues }));
    return mockReact.createElement(Text, null, `Table: ${metricId} ${metricName}`);
  },
}));

it('opens the selected metric table only after the source list closes', () => {
  mockClose.mockClear();
  mockOpenValues.mockClear();
  const { getByText, getByTestId } = render(
    <MetricSourcesBottomSheet
      bottomSheetRef={React.createRef()}
      title="Registered values"
      sources={[
        { metricId: 'resting_hr', label: 'Resting heart rate' },
        { metricId: 'sleep_duration', label: 'Sleep' },
        { metricId: 'hrv_sdnn', label: 'HRV SDNN' },
      ]}
    />
  );
  fireEvent(getByTestId('sources'), 'change', -1);
  expect(mockOpenValues).not.toHaveBeenCalled();
  expect(getByTestId('link-HRV SDNN').props.showIcon).toBe(false);
  fireEvent.press(getByText('HRV SDNN'));
  expect(mockClose).toHaveBeenCalledTimes(1);
  expect(getByText('Table: hrv_sdnn HRV SDNN')).toBeTruthy();
  expect(mockOpenValues).not.toHaveBeenCalled();
  fireEvent(getByTestId('sources'), 'change', -1);
  expect(mockOpenValues).toHaveBeenCalledWith(1);
  fireEvent(getByTestId('sources'), 'change', -1);
  expect(mockOpenValues).toHaveBeenCalledTimes(1);
});
