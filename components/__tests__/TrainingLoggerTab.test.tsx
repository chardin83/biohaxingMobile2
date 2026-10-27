import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

import { TrainingLoggerTab } from '../journal/TrainingLoggerTab';

const mockAdd = jest.fn();
beforeEach(() => mockAdd.mockClear());
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ dailyTrainingTracking: {}, addTrainingEntry: mockAdd, updateTrainingEntry: jest.fn(), removeTrainingEntry: jest.fn() }) }));
jest.mock('../LoggedTrainingSection', () => ({ LoggedTrainingSection: () => null }));
jest.mock('../journal/DailyTrainingSummary', () => ({ DailyTrainingSummary: () => null }));
jest.mock('../journal/TrainingPlanTargetsSection', () => ({ TrainingPlanTargetsSection: () => null }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ThemedText', () => ({ ThemedText: ({ children }: any) => {
  const { Text } = require('react-native');
  return <Text>{children}</Text>;
} }));
jest.mock('../ui/AppButton', () => ({ __esModule: true, default: ({ title, onPress }: any) => {
  const { Pressable, Text } = require('react-native');
  return <Pressable onPress={onPress}><Text>{title}</Text></Pressable>;
} }));
jest.mock('../ui/inputs/DateTimeInput', () => ({ DateTimeInput: ({ onChange }: any) => {
  const { Pressable, Text } = require('react-native');
  return <Pressable accessibilityLabel="pick-time" onPress={() => onChange(new Date(2026, 9, 1, 8, 30))}><Text>Pick time</Text></Pressable>;
} }));
jest.mock('../ui/CancelButton', () => ({ CancelButton: () => null }));
jest.mock('../ui/inputs/TextInput', () => ({ __esModule: true, default: () => null }));
jest.mock('../ui/inputs/StepperInput', () => ({ __esModule: true, default: ({ label, value, onChangeText, errorText }: any) => {
  const { TextInput } = require('react-native');
  return <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} accessibilityHint={errorText} />;
} }));

it('offers four matching intensity levels and saves the selected high-intensity level', () => {
  const screen = render(<TrainingLoggerTab selectedDate="2026-10-26" />);
  fireEvent.press(screen.getByText('training:trainingOpenFormButton'));
  for (const level of ['Low', 'Moderate', 'Intense', 'High']) expect(screen.getByText(`training:trainingIntensity${level}`)).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('training:trainingDurationLabel'), '30');
  fireEvent.press(screen.getByLabelText('pick-time'));
  fireEvent.press(screen.getByText('training:trainingIntensityHigh'));
  fireEvent.press(screen.getByText('training:trainingSaveButton'));
  expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ intensity: 'high', durationMinutes: 30, date: '2026-10-26', startTime: new Date(2026, 9, 26, 8, 30).toISOString(), endTime: new Date(2026, 9, 26, 9, 0).toISOString() }));
});


it('rejects missing time and duration together, then accepts them only when both are valid', () => {
  const screen = render(<TrainingLoggerTab selectedDate="2026-10-26" />);
  fireEvent.press(screen.getByText('training:trainingOpenFormButton'));
  fireEvent.press(screen.getByText('training:trainingSaveButton'));
  expect(screen.getByLabelText('pick-time').props.accessibilityHint).toBeUndefined();
  expect(screen.getByLabelText('training:trainingDurationLabel').props.accessibilityHint).toBe('training:trainingDurationError');
  expect(screen.queryByText('training:trainingTimeError')).toBeNull();
  expect(screen.queryByText('training:trainingDurationError')).toBeNull();
  expect(mockAdd).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('training:trainingDurationLabel'), '0');
  fireEvent.press(screen.getByLabelText('pick-time'));
  fireEvent.press(screen.getByText('training:trainingSaveButton'));
  expect(mockAdd).not.toHaveBeenCalled();
  fireEvent.changeText(screen.getByLabelText('training:trainingDurationLabel'), '15');
  fireEvent.press(screen.getByText('training:trainingSaveButton'));
  expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({ durationMinutes: 15 }));
});
