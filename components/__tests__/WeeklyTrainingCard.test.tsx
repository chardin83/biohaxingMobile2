import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { WeeklyTrainingCard } from '../metrics/WeeklyTrainingCard';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { area: { cardio: 'red' } } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ getMetricHistory: () => [] }) }));
jest.mock('../ThemedText', () => ({ ThemedText: ({ children }: any) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
} }));
jest.mock('../ui/Card', () => ({ Card: ({ children }: any) => children }));

it('toggles the weekly WHO explanation beneath the metric', () => {
  const screen = render(<WeeklyTrainingCard />);
  expect(screen.queryByText('metrics:weightedTrainingMinutes.weeklyExplanation')).toBeNull();
  fireEvent.press(screen.getByRole('button'));
  expect(screen.getByText('metrics:weightedTrainingMinutes.weeklyExplanation')).toBeTruthy();
  fireEvent.press(screen.getByRole('button'));
  expect(screen.queryByText('metrics:weightedTrainingMinutes.weeklyExplanation')).toBeNull();
});
