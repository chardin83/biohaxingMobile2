import { render } from '@testing-library/react-native';
import React from 'react';

import type { TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';

import { DailyTrainingSummary } from '../journal/DailyTrainingSummary';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { chart: { steps: 'blue' } } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'sv' }, t: (key: string, options?: { count?: number; value?: number }) => {
  if (key === 'training:trainingMinutesUnit') return 'min';
  if (key === 'training:dailySummary.sessionCount') return `${options?.count} pass`;
  if (key === 'training:dailySummary.loggedSessions') return `${options?.count} registrerade pass`;
  return key;
} }) }));
jest.mock('../ThemedText', () => ({ ThemedText: ({ children }: any) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
} }));
jest.mock('../ui/Card', () => ({ Card: ({ children }: any) => children }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

const base: TrainingLogEntry = { id: 'run', activityType: 'running', durationMinutes: 49, date: '2026-10-26', createdAt: '' };

it('shows day totals and a non-overlapping intensity distribution, then updates for a different day', () => {
  const screen = render(<DailyTrainingSummary entries={[
    { ...base, distanceKm: 7, moderateMinutes: 10, intensityMinutes: 39, highIntensityMinutes: 8 },
    { ...base, id: 'walk', durationMinutes: 25, distanceKm: 1.6, moderateMinutes: 8, intensityMinutes: 17, highIntensityMinutes: 2 },
  ]} />);
  for (const text of ['74 min', '2 pass', '18 min', '46 min', '10 min', '24%', '62%', '14%']) expect(screen.getByText(text)).toBeTruthy();
  expect(screen.getByText(/8[.,]6 km/)).toBeTruthy();
  screen.rerender(<DailyTrainingSummary entries={[]} />);
  expect(screen.getByText('0 pass')).toBeTruthy();
  expect(screen.queryByText('74 min')).toBeNull();
});

it('shows missing intensity as unknown rather than zero or moderate training', () => {
  const screen = render(<DailyTrainingSummary entries={[{ ...base, durationMinutes: 60 }]} />);
  expect(screen.getByText('60 min')).toBeTruthy();
  expect(screen.getByText('training:dailySummary.lowIntensity')).toBeTruthy();
  expect(screen.queryByText(/Okänd\/lätt/)).toBeNull();
  expect(screen.queryByText('0%')).toBeNull();
});


it('does not label a gym session as low intensity', () => {
  const screen = render(<DailyTrainingSummary entries={[{ ...base, activityType: 'gym', durationMinutes: 60, lowIntensityMinutes: 60 }]} />);
  expect(screen.getAllByText('60 min')).toHaveLength(1);
  expect(screen.queryByText('100%')).toBeNull();
});
