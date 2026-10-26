import { render } from '@testing-library/react-native';
import React from 'react';

import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import { toLocalDateKey } from '@/utils/metricDateUtils';

import { WeeklyTrainingCard } from '../metrics/WeeklyTrainingCard';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { area: { cardio: 'red' } } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
let mockHistory: MetricEntry[] = [];
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ getMetricHistory: (metricId: string) => mockHistory.filter(entry => entry.metricId === metricId) }) }));
beforeEach(() => { mockHistory = []; });
jest.mock('../ThemedText', () => ({ ThemedText: ({ children }: any) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
} }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/Card', () => ({ Card: ({ children }: any) => children }));

it('always shows the WHO explanation without a clickable metric', () => {
  const screen = render(<WeeklyTrainingCard />);
  expect(screen.getByText('metrics:weightedTrainingMinutes.weeklyExplanation')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});

it('shows weekly progress against 300 and retains the full total above the visual limit', () => {
  const recordedAt = `${toLocalDateKey(new Date())}T00:00:00`;
  mockHistory = [{ metricId: 'weighted_training_minutes', value: 150, unit: 'min', recordedAt }];
  const screen = render(<WeeklyTrainingCard />);
  expect(screen.getByRole('progressbar').props.accessibilityValue).toEqual({ min: 0, max: 300, now: 150 });
  expect(screen.getByText('metrics:weightedTrainingMinutes.targetRange')).toBeTruthy();
  mockHistory = [{ ...mockHistory[0], value: 350 }];
  screen.rerender(<WeeklyTrainingCard />);
  expect(screen.getByText('350')).toBeTruthy();
  expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(300);
});


it('shows the unweighted moderate and vigorous totals for this week beneath the weighted total', () => {
  const recordedAt = `${toLocalDateKey(new Date())}T00:00:00`;
  mockHistory = [
    { metricId: 'weighted_training_minutes', value: 85, unit: 'min', recordedAt },
    { metricId: 'moderate_minutes', value: 25, unit: 'min', recordedAt },
    { metricId: 'intensity_minutes', value: 30, unit: 'min', recordedAt },
  ];
  const screen = render(<WeeklyTrainingCard />);
  expect(screen.getByText('85')).toBeTruthy();
  expect(screen.getByText('25 training:trainingMinutesUnit')).toBeTruthy();
  expect(screen.getByText('30 training:trainingMinutesUnit')).toBeTruthy();
});
