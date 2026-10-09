import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import RelatedMetricsSection from '@/app/(stack)/dashboard/area/[areaId]/details/sections/RelatedMetricsSection';

const mockPresent = jest.fn();
const mockDismiss = jest.fn();
const mockOpenValues = jest.fn();
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ bottom: 0 }) }));
jest.mock('../ui/BottomSheetDesign', () => ({ useBottomSheetDesign: () => ({}) }));
jest.mock('@/locales/metrics', () => {
  const ids = ['sleep_duration', 'deep_sleep', 'rem_sleep', 'resting_hr', 'hrv'];
  return { metrics: Object.fromEntries(ids.map(id => [id, {}])), tipMetricLinks: { example: ids.map(metricId => ({ metricId })) } };
});
jest.mock('../ui/CardLinkList', () => ({
  CardLinkList: ({ rows }: any) => {
    const mockReact = require('react');
    const { Text, Pressable } = require('react-native');
    return rows.map((row: any) => mockReact.createElement(Pressable, { key: row.key, onPress: row.onPress, testID: row.title, iconName: row.iconName },
      mockReact.createElement(Text, null, row.title),
      row.subtitle && mockReact.createElement(Text, null, row.subtitle)));
  },
}));
jest.mock('@gorhom/bottom-sheet', () => {
  const mockReact = require('react');
  const { View } = require('react-native');
  return {
    BottomSheetModal: mockReact.forwardRef(({ children, onDismiss }: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({ present: mockPresent, dismiss: mockDismiss }));
      return mockReact.createElement(View, { testID: 'information-sheet', onDismiss }, children);
    }),
    BottomSheetBackdrop: View,
    BottomSheetView: View,
    BottomSheetScrollView: View,
  };
});
jest.mock('../sections/metrics/MetricValuesBottomSheet', () => ({
  MetricValuesBottomSheet: function MockMetricValues({ bottomSheetRef, metricId }: any) {
    const mockReact = require('react');
    mockReact.useImperativeHandle(bottomSheetRef, () => ({ snapToIndex: mockOpenValues }));
    return mockReact.createElement(require('react-native').Text, null, `Table: ${metricId}`);
  },
}));

beforeEach(() => jest.clearAllMocks());

it('lists five related metrics and opens the existing value sheet after dismissing the list', () => {
  const screen = render(<RelatedMetricsSection tipId="example" />);
  const overview = screen.getByTestId('common:tipDetails.metricsTitle (5)');
  expect(overview.props.iconName).toBe('chart');
  expect(screen.getByText('metrics:sleep_duration.name, metrics:deep_sleep.name, metrics:rem_sleep.name, metrics:resting_hr.name, metrics:hrv.name')).toBeTruthy();
  expect(screen.getAllByTestId('information-sheet')).toHaveLength(1);
  fireEvent.press(overview);
  expect(mockPresent).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('metrics:deep_sleep.name'));
  expect(mockDismiss).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Table: deep_sleep')).toBeTruthy();
  expect(mockOpenValues).not.toHaveBeenCalled();
  fireEvent(screen.getByTestId('information-sheet'), 'dismiss');
  expect(mockOpenValues).toHaveBeenCalledWith(1);
  fireEvent(screen.getByTestId('information-sheet'), 'dismiss');
  expect(mockOpenValues).toHaveBeenCalledTimes(1);
});

it('hides the card when the tip has no related metrics', () => {
  const screen = render(<RelatedMetricsSection tipId="missing" />);
  expect(screen.queryByTestId('information-sheet')).toBeNull();
});
