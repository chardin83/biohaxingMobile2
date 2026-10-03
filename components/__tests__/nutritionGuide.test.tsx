import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import NutritionPage from '@/app/(stack)/settings/nutrition';
import NutritionEnergySummary from '@/components/NutritionEnergySummary';

const mockUpdateProfile = jest.fn();
const mockDismissTo = jest.fn();
let mockProfile = {};

jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({ userProfile: mockProfile, updateUserProfile: mockUpdateProfile }),
}));
jest.mock('expo-router', () => ({ router: { dismissTo: (...args: unknown[]) => mockDismissTo(...args) } }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'sv' } }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('@/components/NutritionPersonalDetails', () => () => {
  const { Text } = require('react-native');
  return <Text>guide</Text>;
});
jest.mock('@/components/NutritionSettings', () => () => {
  const { Text } = require('react-native');
  return <Text>goals</Text>;
});
jest.mock('@/components/ui/Container', () => ({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) => {
  const { View } = require('react-native');
  return (
    <View>
      {children}
      {footer}
    </View>
  );
});
jest.mock('@/components/ui/AppButton', () => ({ title, onPress, disabled }: { title: string; onPress: () => void; disabled: boolean }) => {
  const { Pressable, Text } = require('react-native');
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </Pressable>
  );
});
jest.mock('@/components/ui/Notice', () => () => null);
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));

describe('nutrition guide completion', () => {
  beforeEach(() => {
    mockProfile = {};
    jest.clearAllMocks();
  });

  it('shows the guide on the first visit and goals after completion', () => {
    const { getByText, rerender } = render(<NutritionPage />);
    expect(getByText('guide')).toBeTruthy();
    mockProfile = { nutritionGuideCompleted: true };
    rerender(<NutritionPage />);
    expect(getByText('goals')).toBeTruthy();
  });

  it('saves completion before leaving the third step', async () => {
    mockUpdateProfile.mockResolvedValueOnce({ nutritionGuideCompleted: true });
    const { getByText } = render(<NutritionEnergySummary />);
    fireEvent.press(getByText('onboarding.continue'));
    await waitFor(() => expect(mockDismissTo).toHaveBeenCalledWith('/settings/nutrition'));
    expect(mockUpdateProfile).toHaveBeenCalledWith({ nutritionGuideCompleted: true });
  });

  it('stays in the guide and shows an error if saving fails', async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error('save failed'));
    const { getByText } = render(<NutritionEnergySummary />);
    fireEvent.press(getByText('onboarding.continue'));
    await waitFor(() => expect(getByText('nutritionGoals.summary.saveError')).toBeTruthy());
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});
