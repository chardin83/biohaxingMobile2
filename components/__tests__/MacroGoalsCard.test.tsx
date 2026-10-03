import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';

import MacroGoalsCard from '../journal/MacroGoalsCard';

let mockProfile: UserProfile = {};
const mockUpdate = jest.fn();
const mockPush = jest.fn();
jest.mock('@/app/context/StorageContext', () => ({ useStorage: () => ({ userProfile: mockProfile, updateUserProfile: mockUpdate }) }));
jest.mock('expo-router', () => ({ router: { push: (...args: unknown[]) => mockPush(...args) } }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('../ui/AppButton', () => ({ title, onPress }: { title: string; onPress: () => void }) => {
  const { Pressable, Text } = require('react-native');
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
});

const goals = { protein: 100, carbohydrates: 250, fat: 70 };

describe('MacroGoalsCard', () => {
  beforeEach(() => {
    mockProfile = {};
    jest.clearAllMocks();
  });

  it('offers setup when no targets are saved', () => {
    const { getByText } = render(<MacroGoalsCard />);
    fireEvent.press(getByText('nutritionGoals.logger.setGoals'));
    expect(mockPush).toHaveBeenCalledWith('/settings/nutrition');
  });

  it('shows saved goals and allows editing them', () => {
    mockProfile = { nutritionGoals: goals };
    const { getByText, getByLabelText } = render(<MacroGoalsCard totals={{ calories: 750, protein: 35, carbohydrates: 80, fat: 22.5 }} />);
    expect(getByText('750')).toBeTruthy();
    expect(getByText('/ 2030 kcal')).toBeTruthy();
    expect(getByText('kcal')).toBeTruthy();
    expect(getByLabelText('nutritionGoals.logger.energyProgress')).toBeTruthy();
    expect(getByText('35 / 100 g')).toBeTruthy();
    expect(getByText('80 / 250 g')).toBeTruthy();
    expect(getByText('22.5 / 70 g')).toBeTruthy();
    fireEvent.press(getByLabelText('nutritionGoals.edit'));
    expect(mockPush).toHaveBeenCalledWith('/settings/nutrition-goals');
  });

  it('opts out without deleting existing targets and hides them', async () => {
    mockProfile = { nutritionGoals: goals };
    mockUpdate.mockResolvedValueOnce({ ...mockProfile, trackMacros: false });
    const { getByLabelText, getByText, queryByText, rerender } = render(<MacroGoalsCard />);
    fireEvent(getByLabelText('nutritionGoals.logger.track'), 'valueChange', false);
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ trackMacros: false }));
    mockProfile = { nutritionGoals: goals, trackMacros: false };
    rerender(<MacroGoalsCard />);
    expect(getByText('nutritionGoals.logger.disabled')).toBeTruthy();
    expect(queryByText('100 g')).toBeNull();
    expect(queryByText('nutritionGoals.logger.setGoals')).toBeNull();
  });

  it('allows opting back in', async () => {
    mockProfile = { nutritionGoals: goals, trackMacros: false };
    mockUpdate.mockResolvedValueOnce({ ...mockProfile, trackMacros: true });
    const { getByLabelText } = render(<MacroGoalsCard />);
    fireEvent(getByLabelText('nutritionGoals.logger.track'), 'valueChange', true);
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith({ trackMacros: true }));
  });
  it('shows zero intake for an empty day and updates when the selected day changes', () => {
    mockProfile = { nutritionGoals: goals };
    const { getByText, rerender } = render(<MacroGoalsCard />);
    expect(getByText('0 / 100 g')).toBeTruthy();
    expect(getByText('0')).toBeTruthy();
    rerender(<MacroGoalsCard totals={{ calories: 900, protein: 120, carbohydrates: 30, fat: 15 }} />);
    expect(getByText('120 / 100 g')).toBeTruthy();
    expect(getByText('900')).toBeTruthy();
    rerender(<MacroGoalsCard />);
    expect(getByText('0 / 100 g')).toBeTruthy();
  });
});
