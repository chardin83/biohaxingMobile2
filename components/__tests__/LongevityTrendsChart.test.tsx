import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import type { DailyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';

import { LongevityTrendsChart } from '../metrics/LongevityTrendsChart';

const mockSnapToIndex = jest.fn();
let mockTracking: DailyNutritionTracking = {};
let mockEntries = [{ metricId: 'glycemic_index', value: 52.34, unit: 'index', recordedAt: '2020-01-01T12:00:00' }];
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ getMetricHistory: () => mockEntries, dailyNutritionTracking: mockTracking }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { primary: 'green' } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: { value?: number }) => key === 'metrics:glycemic_index.coverage' ? `Coverage: ${options?.value}%` : key, i18n: { language: 'sv' } }) }));
jest.mock('../ui/Card', () => ({ Card: ({ children }: any) => children }));
jest.mock('../metrics/MetricDataStatus', () => ({ MetricDataStatus: () => null }));
jest.mock('../metrics/MetricTrendChart', () => ({ MetricTrendChart: (props: any) => {
  const { Pressable, Text } = require('react-native');
  return <Pressable testID="gi-chart" onPress={props.onViewRegisteredValues} accessibilityValue={{ text: String(props.showPeriodAverage) }}><Text>{props.metricName}</Text></Pressable>;
} }));
jest.mock('../sections/metrics/MetricValuesBottomSheet', () => ({ MetricValuesBottomSheet: ({ bottomSheetRef }: any) => {
  bottomSheetRef.current = { snapToIndex: mockSnapToIndex };
  return null;
} }));

it('opens GI with its period average and registered values, then toggles the chart closed', () => {
  const screen = render(<LongevityTrendsChart />);
  expect(screen.getByText('52,3')).toBeTruthy();
  expect(screen.queryByTestId('gi-chart')).toBeNull();
  fireEvent.press(screen.getByRole('button'));
  expect(screen.getByTestId('gi-chart').props.accessibilityValue.text).toBe('true');
  fireEvent.press(screen.getByTestId('gi-chart'));
  expect(mockSnapToIndex).toHaveBeenCalledWith(1);
  fireEvent.press(screen.getByText('metrics:glycemic_index.shortName'));
  expect(screen.queryByTestId('gi-chart')).toBeNull();
});

it('keeps the chart available when the food log has no GI values', () => {
  mockEntries = [];
  const screen = render(<LongevityTrendsChart />);
  expect(screen.queryByText('52,3')).toBeNull();
  fireEvent.press(screen.getByRole('button'));
  expect(screen.getByTestId('gi-chart')).toBeTruthy();
});

it('shows the latest logged day coverage and does not borrow an older GI for an unknown day', () => {
  const known = { id: 'known', type: 'meal' as const, name: 'Meal', recordedAt: '2020-01-01T12:00:00', calories: 100, protein: 0, fat: 0, fiber: 0, carbohydrates: 20, glycemicIndex: 50 };
  const goalsMet = { calories: false, protein: false, fat: false, fiber: false, carbohydrates: false };
  const totals = { calories: 100, protein: 0, fat: 0, fiber: 0, carbohydrates: 100 };
  mockTracking = { '2020-01-01': { date: '2020-01-01', entries: [known, { ...known, id: 'unknown', carbohydrates: 80, glycemicIndex: undefined }], totals, goalsMet } };
  const screen = render(<LongevityTrendsChart />);
  expect(screen.getByText('50')).toBeTruthy();
  expect(screen.getByText('Coverage: 20%')).toBeTruthy();
  mockTracking = { ...mockTracking, '2020-01-02': { date: '2020-01-02', entries: [{ ...known, glycemicIndex: undefined }], totals, goalsMet } };
  screen.rerender(<LongevityTrendsChart />);
  expect(screen.queryByText('50')).toBeNull();
  expect(screen.getByText('—')).toBeTruthy();
  expect(screen.getByText('Coverage: 0%')).toBeTruthy();
  mockTracking = {};
});
