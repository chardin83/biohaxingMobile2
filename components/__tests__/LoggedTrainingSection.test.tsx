import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import type { TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';

import { LoggedTrainingSection } from '../LoggedTrainingSection';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { chart: { steps: 'blue' } } }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: { value?: number }) => key === 'training:trainingIntenseMinutesCompact' ? `Intensiv ${options?.value} min` : key === 'training:trainingModerateMinutesCompact' ? `Måttlig ${options?.value} min` : key === 'training:trainingHighIntensityMinutesCompact' ? `Hög ${options?.value} min` : key }) }));
jest.mock('../Collapsible', () => ({ Collapsible: ({ children }: any) => children }));
jest.mock('../ThemedText', () => ({ ThemedText: ({ children }: any) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
} }));
jest.mock('../ui/Card', () => ({ Card: ({ children }: any) => children }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/SwipeableRow', () => ({ SwipeableRow: ({ children }: any) => children }));

const entry: TrainingLogEntry = { id: 'run', date: '2026-10-20', activityType: 'running', durationMinutes: 60, createdAt: '', origin: 'healthkit' };

it('shows measured intense minutes, including zero, but omits missing data in the journal', () => {
  const props = { onEdit: jest.fn(), onDelete: jest.fn() };
  const screen = render(<LoggedTrainingSection {...props} entries={[{ ...entry, moderateMinutes: 20, intensityMinutes: 15, highIntensityMinutes: 5 }]} />);
  expect(screen.getByText('Intensiv 15 min')).toBeTruthy();
  expect(screen.getByText('Måttlig 20 min')).toBeTruthy();
  expect(screen.getByText('Hög 5 min')).toBeTruthy();
  screen.rerender(<LoggedTrainingSection {...props} entries={[{ ...entry, intensityMinutes: 0 }]} />);
  expect(screen.getByText('Intensiv 0 min')).toBeTruthy();
  screen.rerender(<LoggedTrainingSection {...props} entries={[entry]} />);
  expect(screen.queryByText(/Intensiv .* min/)).toBeNull();
});


it('shows original source, distance and measured average pulse, with delete but no edit for imported sessions', () => {
  const onDelete = jest.fn();
  const screen = render(<LoggedTrainingSection onEdit={jest.fn()} onDelete={onDelete} entries={[{ ...entry, sourceName: 'Garmin Connect', distanceKm: 7.02, averageHeartRate: 142, startTime: '2026-10-20T07:12:00' }]} />);
  expect(screen.getByText('Garmin Connect')).toBeTruthy();
  expect(screen.getByText('142 bpm')).toBeTruthy();
  expect(screen.getByText(/7[.,]02 km/)).toBeTruthy();
  expect(screen.queryByLabelText('training:trainingSessionActions')).toBeNull();
  const row = screen.UNSAFE_getByType(require('../ui/SwipeableRow').SwipeableRow);
  expect(row.props.onEdit).toBeUndefined();
  row.props.onDelete();
  expect(onDelete).toHaveBeenCalledWith(entry.id);
});

it('retains edit actions for manual sessions', () => {
  const onEdit = jest.fn();
  const screen = render(<LoggedTrainingSection onEdit={onEdit} onDelete={jest.fn()} entries={[{ ...entry, origin: 'manual' }]} />);
  fireEvent.press(screen.getByRole('button'));
  expect(onEdit).toHaveBeenCalledWith(entry.id);
});
