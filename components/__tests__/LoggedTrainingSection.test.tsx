import { render } from '@testing-library/react-native';
import React from 'react';

import type { TrainingLogEntry } from '@/app/context/storage/training/trainingTypes';

import { LoggedTrainingSection } from '../LoggedTrainingSection';

jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string, options?: { value?: number }) => key === 'training:trainingIntenseMinutes' ? `${options?.value} intensiva min` : key === 'training:trainingModerateMinutes' ? `${options?.value} måttliga min` : key }) }));
jest.mock('../Collapsible', () => ({ Collapsible: ({ children }: any) => children }));
jest.mock('../ThemedText', () => ({ ThemedText: ({ children }: any) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
} }));
jest.mock('../ui/Card', () => ({ Card: ({ children }: any) => children }));
jest.mock('../ui/SwipeableRow', () => ({ SwipeableRow: ({ children }: any) => children }));

const entry: TrainingLogEntry = { id: 'run', date: '2026-10-20', activityType: 'running', durationMinutes: 60, createdAt: '', origin: 'healthkit' };

it('shows measured intense minutes, including zero, but omits missing data in the journal', () => {
  const props = { onEdit: jest.fn(), onDelete: jest.fn() };
  const screen = render(<LoggedTrainingSection {...props} entries={[{ ...entry, moderateMinutes: 20, intensityMinutes: 15 }]} />);
  expect(screen.getByText('15 intensiva min')).toBeTruthy();
  expect(screen.getByText('20 måttliga min')).toBeTruthy();
  screen.rerender(<LoggedTrainingSection {...props} entries={[{ ...entry, intensityMinutes: 0 }]} />);
  expect(screen.getByText('0 intensiva min')).toBeTruthy();
  screen.rerender(<LoggedTrainingSection {...props} entries={[entry]} />);
  expect(screen.queryByText(/intensiva min/)).toBeNull();
});
