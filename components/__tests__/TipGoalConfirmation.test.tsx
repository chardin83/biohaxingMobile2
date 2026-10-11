import { act, render } from '@testing-library/react-native';
import React from 'react';
import { AppState } from 'react-native';

import { tips } from '@/locales/tips';

import TipGoalConfirmation from '../metrics/TipGoalConfirmation';

const tip = tips.find(item => item.id === 'hrv_recovery_monitoring')!;

const mockLog = jest.fn();
const mockStorage = { plans: { other: [{ tipId: 'hrv_recovery_monitoring', startedAt: '2026-01-01' }] }, dailyHabitTracking: {} as Record<string, Record<string, { isFulfilled: boolean }>> };
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => mockStorage }));
jest.mock('@/hooks/useHabitTracking', () => ({ useHabitTracking: () => ({ logHabit: mockLog }) }));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true, useTheme: () => ({ colors: jest.requireActual('@/app/theme/Colors').Colors.light }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));

beforeEach(() => {
  AppState.currentState = 'active';
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-11T12:00:00Z'));
  mockLog.mockClear();
  mockStorage.dailyHabitTracking = {};
  mockStorage.plans.other = [{ tipId: 'hrv_recovery_monitoring', startedAt: '2026-01-01' }];
});
afterEach(() => jest.useRealTimers());

it('records today after five seconds and displays the persisted confirmation', () => {
  const screen = render(<TipGoalConfirmation tip={tip} />);
  act(() => jest.advanceTimersByTime(4900));
  expect(mockLog).not.toHaveBeenCalled();
  act(() => jest.advanceTimersByTime(100));
  expect(mockLog).toHaveBeenCalledWith({ trackingKey: 'hrv_recovery_review', selectedDate: '2026-10-11', value: 1, slot: 'daily' });
  mockStorage.dailyHabitTracking = { '2026-10-11': { hrv_recovery_review: { isFulfilled: true } } };
  screen.rerender(<TipGoalConfirmation tip={tip} />);
  expect(screen.getByText('hrv_recovery_monitoring.goalReview.completedTitle')).toBeTruthy();
  expect(screen.queryByTestId('countdown-circle')).toBeNull();
});

it('does not start a countdown before the tip was added', () => {
  mockStorage.plans.other = [{ tipId: 'hrv_recovery_monitoring', startedAt: '2026-10-12' }];
  const screen = render(<TipGoalConfirmation tip={tip} />);
  expect(screen.queryByTestId('countdown-circle')).toBeNull();
  act(() => jest.advanceTimersByTime(5000));
  expect(mockLog).not.toHaveBeenCalled();
});

it('uses the tip configuration for the countdown and confirmation text', () => {
  const configuredTip = {
    ...tip,
    goalConfirmation: { ...tip.goalConfirmation!, seconds: 2, pendingTitleKey: 'custom.pending', completedTitleKey: 'custom.completed' },
  };
  const screen = render(<TipGoalConfirmation tip={configuredTip} />);
  expect(screen.getByText('custom.pending')).toBeTruthy();
  act(() => jest.advanceTimersByTime(2000));
  expect(mockLog).toHaveBeenCalledTimes(1);
});

it('does not show a confirmation for a tip without that configuration', () => {
  const screen = render(<TipGoalConfirmation tip={{ ...tip, goalConfirmation: undefined }} />);
  expect(screen.queryByTestId('countdown-circle')).toBeNull();
});
