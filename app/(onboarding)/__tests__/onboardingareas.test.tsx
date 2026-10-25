import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import OnboardingAreas from '../onboardingareas';
import OnboardingSupplements from '../onboardingsupplements';

let mockAreas = ['nutrition'];
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockComplete = jest.fn();
const mockPlans = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, replace: mockReplace }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: {} }) }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({
    updateUserProfile: mockUpdate,
    setHasCompletedOnboarding: mockComplete,
    setPlans: mockPlans,
    setOnboardingStep: jest.fn(),
    userProfile: {},
    onboardingStep: 0,
    myAreas: mockAreas,
    setMyAreas: jest.fn(),
  }),
}));
jest.mock('@/components/NutritionPersonalDetails', () => ({ onContinue, onBack, onSaved, currentStep, totalSteps }: any) => {
  const { View, Text, Pressable } = require('react-native');
  return (
    <View>
      <Text>NutritionPersonalDetails</Text>
      <Text>
        {currentStep}/{totalSteps}
      </Text>
      <Pressable onPress={onContinue ?? onSaved}>
        <Text>Next macro</Text>
      </Pressable>
      <Pressable onPress={onBack}>
        <Text>Back macro</Text>
      </Pressable>
    </View>
  );
});
jest.mock('@/components/NutritionActivitySettings', () => ({ onContinue, onBack, onSaved, currentStep, totalSteps }: any) => {
  const { View, Text, Pressable } = require('react-native');
  return (
    <View>
      <Text>NutritionActivitySettings</Text>
      <Text>
        {currentStep}/{totalSteps}
      </Text>
      <Pressable onPress={onContinue ?? onSaved}>
        <Text>Next macro</Text>
      </Pressable>
      <Pressable onPress={onBack}>
        <Text>Back macro</Text>
      </Pressable>
    </View>
  );
});
jest.mock('@/components/NutritionEnergySummary', () => ({ onContinue, onBack, onSaved, currentStep, totalSteps }: any) => {
  const { View, Text, Pressable } = require('react-native');
  return (
    <View>
      <Text>NutritionEnergySummary</Text>
      <Text>
        {currentStep}/{totalSteps}
      </Text>
      <Pressable onPress={onContinue ?? onSaved}>
        <Text>Next macro</Text>
      </Pressable>
      <Pressable onPress={onBack}>
        <Text>Back macro</Text>
      </Pressable>
    </View>
  );
});
jest.mock('@/components/NutritionDistributionStep', () => ({ onContinue, onBack, onSaved, currentStep, totalSteps }: any) => {
  const { View, Text, Pressable } = require('react-native');
  return (
    <View>
      <Text>NutritionDistributionStep</Text>
      <Text>
        {currentStep}/{totalSteps}
      </Text>
      <Pressable onPress={onContinue ?? onSaved}>
        <Text>Next macro</Text>
      </Pressable>
      <Pressable onPress={onBack}>
        <Text>Back macro</Text>
      </Pressable>
    </View>
  );
});
jest.mock('@/components/NutritionSettings', () => ({ onContinue, onBack, onSaved, currentStep, totalSteps }: any) => {
  const { View, Text, Pressable } = require('react-native');
  return (
    <View>
      <Text>NutritionSettings</Text>
      <Text>
        {currentStep}/{totalSteps}
      </Text>
      <Pressable onPress={onContinue ?? onSaved}>
        <Text>Next macro</Text>
      </Pressable>
      <Pressable onPress={onBack}>
        <Text>Back macro</Text>
      </Pressable>
    </View>
  );
});
jest.mock('@/locales/supplements', () => ({ useSupplements: () => [{ id: 'magnesium', name: 'Magnesium' }] }));
jest.mock('@/components/Areas', () => ({ invalid }: any) => {
  const { Text } = require('react-native');
  return <Text>{invalid ? 'Invalid areas' : 'Areas'}</Text>;
});
jest.mock('@/components/ui/Notice', () => ({ message }: any) => {
  const { Text } = require('react-native');
  return <Text>{message}</Text>;
});
jest.mock('@/components/ui/Container', () => ({ children, footer }: any) => {
  const { View } = require('react-native');
  return (
    <View>
      {children}
      {footer}
    </View>
  );
});
jest.mock('@/components/ui/StepsContainer', () => ({ children, footer, title }: any) => {
  const { View, Text } = require('react-native');
  return (
    <View>
      <Text>{title}</Text>
      {children}
      {footer}
    </View>
  );
});
jest.mock('@/components/ui/AppButton', () => ({ title, onPress, disabled }: any) => {
  const { Pressable, Text } = require('react-native');
  return (
    <Pressable onPress={onPress} disabled={disabled}>
      <Text>{title}</Text>
    </Pressable>
  );
});
jest.mock('@/components/ui/AppCard', () => ({ title, onPress }: any) => {
  const { Pressable, Text } = require('react-native');
  return (
    <Pressable onPress={onPress}>
      <Text>{title}</Text>
    </Pressable>
  );
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAreas = ['nutrition'];
});

it.each([true, false])('saves macro tracking %s and navigates to the corresponding step', async track => {
  const screen = render(<OnboardingAreas />);
  fireEvent.press(screen.getByText('onboarding.continue'));
  expect(mockComplete).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText(track ? 'onboarding.yes' : 'onboarding.no'));
  if (track) {
    await waitFor(() => expect(screen.getByText('NutritionPersonalDetails')).toBeTruthy());
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByText('3/9')).toBeTruthy();
    fireEvent.press(screen.getByText('Next macro'));
    expect(screen.getByText('4/9')).toBeTruthy();
    fireEvent.press(screen.getByText('Back macro'));
    expect(screen.getByText('NutritionPersonalDetails')).toBeTruthy();
    fireEvent.press(screen.getByText('Next macro'));
    fireEvent.press(screen.getByText('Next macro'));
    expect(screen.getByText('5/9')).toBeTruthy();
    fireEvent.press(screen.getByText('Next macro'));
    expect(screen.getByText('6/9')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Next macro'));
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/onboardingsupplements');
    expect(mockComplete).not.toHaveBeenCalled();
  } else {
    await waitFor(() => expect(screen.getByText('NutritionPersonalDetails')).toBeTruthy());
    expect(screen.getByText('3/7')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Next macro'));
    expect(screen.getByText('NutritionActivitySettings')).toBeTruthy();
    expect(screen.getByText('4/7')).toBeTruthy();
    fireEvent.press(screen.getByText('Next macro'));
    expect(screen.queryByText('NutritionEnergySummary')).toBeNull();
    expect(mockPush).toHaveBeenCalledWith('/(onboarding)/onboardingsupplements');
  }
  expect(mockUpdate).toHaveBeenCalledWith({ trackMacros: track });
});

it('continues to AI plans without completing onboarding when supplements are declined', () => {
  const screen = render(<OnboardingSupplements />);
  fireEvent.press(screen.getByText('onboarding.no'));
  expect(mockPlans).not.toHaveBeenCalled();
  expect(mockComplete).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/onboardingplan');
});

it('saves supplements separately for each selected time', () => {
  const screen = render(<OnboardingSupplements />);
  fireEvent.press(screen.getByText('onboarding.yes'));
  fireEvent.press(screen.getByText('onboarding.breakfast'));
  fireEvent.press(screen.getByText('onboarding.evening'));
  fireEvent.press(screen.getByText('onboarding.continue'));
  fireEvent.press(screen.getByText('Magnesium'));
  fireEvent.press(screen.getByText('onboarding.continue'));
  expect(mockComplete).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Magnesium'));
  fireEvent.press(screen.getByText('onboarding.continue'));
  const saved = mockPlans.mock.calls[0][0]({ supplements: [] }).supplements;
  expect(saved.map((plan: any) => plan.prefferedTime)).toEqual(['08:00', '21:00']);
  expect(saved.every((plan: any) => plan.supplements[0].supplement.id === 'magnesium')).toBe(true);
  expect(mockComplete).not.toHaveBeenCalled();
});

it('filters the catalog while keeping selected supplements visible', () => {
  const screen = render(<OnboardingSupplements />);
  fireEvent.press(screen.getByText('onboarding.yes'));
  fireEvent.press(screen.getByText('onboarding.breakfast'));
  fireEvent.press(screen.getByText('onboarding.continue'));
  const search = screen.getByPlaceholderText('onboarding.searchSupplements');
  fireEvent.changeText(search, 'no match');
  expect(screen.queryByText('Magnesium')).toBeNull();
  fireEvent.changeText(search, 'mag');
  fireEvent.press(screen.getByText('Magnesium'));
  fireEvent.changeText(search, 'no match');
  expect(screen.getByText('Magnesium')).toBeTruthy();
  fireEvent.press(screen.getByText('Magnesium'));
  expect(screen.queryByText('Magnesium')).toBeNull();
});

it('requires an area and clears the validation when an area is selected', () => {
  mockAreas = [];
  const screen = render(<OnboardingAreas />);
  fireEvent.press(screen.getByText('onboarding.continue'));
  expect(screen.getByText('onboarding.selectAtLeastOneArea')).toBeTruthy();
  expect(screen.getByText('Invalid areas')).toBeTruthy();
  expect(screen.queryByText('onboarding.yes')).toBeNull();
  mockAreas = ['nutrition'];
  screen.rerender(<OnboardingAreas />);
  expect(screen.queryByText('onboarding.selectAtLeastOneArea')).toBeNull();
  expect(screen.getByText('Areas')).toBeTruthy();
  fireEvent.press(screen.getByText('onboarding.continue'));
  expect(screen.getByText('onboarding.yes')).toBeTruthy();
});
