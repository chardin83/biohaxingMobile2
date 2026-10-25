import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { StyleSheet } from 'react-native';

import OnboardingPlan from '../onboardingplan';

const mockT = (key: string, options?: any) => (options?.returnObjects ? [] : key);
const mockReplace = jest.fn();
const mockComplete = jest.fn();
const mockSetOnboardingStep = jest.fn();
const mockSetPlans = jest.fn();
const mockSetTempPlans = jest.fn();
const mockGenerate = jest.fn();
let mockShareInterests = true;
let mockShareArchivedPlans = false;
const mockArchives = { training: [], nutrition: [], other: [], supplements: [] };
let mockSharePersonalDetails = true;
let mockTempPlans: any = null;
const mockPlans = { supplements: [], training: [], nutrition: [], other: [] };
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace, push: jest.fn() }) }));
jest.mock('@react-navigation/native', () => ({ useTheme: () => ({ colors: { error: 'red' } }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: { language: 'sv' },
  }),
}));
jest.mock('@/app/context/StorageContext', () => ({
  useStorage: () => ({
    plans: mockPlans,
    tempPlans: mockTempPlans,
    setPlans: mockSetPlans,
    setTempPlans: mockSetTempPlans,
    myAreas: ['sleep'],
    myLevel: 1,
    shareHealthPlan: true,
    shareInterests: mockShareInterests,
    shareArchivedPlans: mockShareArchivedPlans,
    archivedPlans: mockArchives,
    profileSharing: { age: mockSharePersonalDetails, biologicalSex: false, heightCm: false, weightKg: false, activityPal: false },
    userProfile: { trackMacros: false, birthDate: '1990-01-01', biologicalSex: 'female' },
    setHasCompletedOnboarding: mockComplete,
    setOnboardingStep: mockSetOnboardingStep,
  }),
}));
jest.mock('@/services/gptServices', () => ({ createPlan: (...args: any[]) => mockGenerate(...args) }));
jest.mock('@/locales/tips', () => ({ tips: [{ id: 'daily_walk', title: 'daily_walk.title' }] }));
jest.mock('@/components/ui/IconSymbol', () => ({ IconSymbol: () => null }));
jest.mock('@/components/ui/TipDetailsBottomSheet', () => ({ tipId, onDismiss }: any) => {
  const { View, Text, Pressable } = require('react-native');
  return tipId ? (
    <View>
      <Text>Details: {tipId}</Text>
      <Pressable onPress={onDismiss}>
        <Text>Close details</Text>
      </Pressable>
    </View>
  ) : null;
});
jest.mock('@/components/AllInfoPopup', () => ({ visible, onConfirm, setVisible, busy }: any) => {
  const { Pressable, Text } = require('react-native');
  return visible ? (
    <Pressable
      disabled={busy}
      onPress={() => {
        onConfirm();
        setVisible(false);
      }}
    >
      <Text>Confirm AI sharing</Text>
    </Pressable>
  ) : null;
});
jest.mock('@/components/ShowAllButton', () => () => null);
jest.mock('@/components/GradientText', () => ({
  GradientText: ({ children }: any) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));
jest.mock('@/components/ThemedText', () => ({
  ThemedText: ({ children }: any) => {
    const { Text } = require('react-native');
    return <Text>{children}</Text>;
  },
}));
jest.mock('@/components/Collapsible', () => ({ Collapsible: ({ children }: any) => children }));
jest.mock('@/components/ui/Card', () => ({ Card: ({ children }: any) => children }));
jest.mock('@/components/ui/Checkbox', () => ({
  Checkbox: ({ label, accessibilityLabel, onPress, checked }: any) => {
    const { Text, Pressable } = require('react-native');
    return (
      <Pressable accessibilityLabel={accessibilityLabel ?? label} onPress={onPress} accessibilityState={{ checked }}>
        <Text>{label}</Text>
      </Pressable>
    );
  },
}));
jest.mock('@/components/ui/LabeledInput', () => () => null);
jest.mock('@/components/ui/Container', () => ({ children, footer, currentStep, totalSteps, onBackPress }: any) => {
  const { View, Text, Pressable } = require('react-native');
  return (
    <View>
      <Text>
        {currentStep}/{totalSteps}
      </Text>
      <Pressable onPress={onBackPress}>
        <Text>Back</Text>
      </Pressable>
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
jest.mock('@/components/ui/GoldenGlowButton', () => ({
  GoldenGlowButton: ({ title, onPress, disabled, loading }: any) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID="generate-plan-button" onPress={onPress} disabled={disabled} accessibilityState={{ disabled, busy: loading }}>
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockTempPlans = null;
  mockSharePersonalDetails = true;
  mockShareInterests = true;
  mockShareArchivedPlans = false;
});
it('finishes onboarding when the AI step is skipped', () => {
  const screen = render(<OnboardingPlan />);
  expect(screen.getByText('7/7')).toBeTruthy();
  expect(mockComplete).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('onboarding.skipAIPlan'));
  expect(mockComplete).toHaveBeenCalledWith(true);
  expect(mockReplace).toHaveBeenCalledWith('/dashboard');
});
it('returns to supplements without completing onboarding', () => {
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByText('Back'));
  expect(mockComplete).not.toHaveBeenCalled();
  expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/onboardingsupplements');
});
it('only completes onboarding after accepting the generated plan', async () => {
  const generated = { ...mockPlans, training: [{ tipId: 'daily_walk' }] };
  mockGenerate.mockResolvedValue({ plans: generated });
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  await waitFor(() => expect(mockSetTempPlans).toHaveBeenCalledWith(generated));
  expect(mockGenerate.mock.calls[0][5]).toMatchObject({ birthDate: '1990-01-01', biologicalSex: 'female' });
  expect(mockComplete).not.toHaveBeenCalled();
  mockTempPlans = generated;
  screen.rerender(<OnboardingPlan />);
  fireEvent.press(screen.getByText('createPlan.acceptAIPlan'));
  expect(mockSetPlans).toHaveBeenCalled();
  expect(mockComplete).toHaveBeenCalledWith(true);
});
it('shows an error and allows retry when generation fails', async () => {
  mockGenerate.mockRejectedValue(new Error('offline'));
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  await waitFor(() => expect(screen.getByText('onboarding.aiPlanError')).toBeTruthy());
  expect(mockComplete).not.toHaveBeenCalled();
  mockGenerate.mockResolvedValueOnce({ plans: mockPlans });
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  await waitFor(() => expect(mockSetTempPlans).toHaveBeenCalledWith(mockPlans));
});

it('shows the translated tip title in a generated plan', () => {
  mockTempPlans = { ...mockPlans, training: [{ tipId: 'daily_walk' }] };
  const screen = render(<OnboardingPlan />);
  expect(screen.getByText('tips:daily_walk.title')).toBeTruthy();
  expect(screen.queryByText('daily_walk')).toBeNull();
});

it('opens and closes tip details without accepting the plan', () => {
  mockTempPlans = { ...mockPlans, training: [{ tipId: 'daily_walk' }] };
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByLabelText('createPlan.tipDetails'));
  expect(screen.getByText('Details: daily_walk')).toBeTruthy();
  expect(mockSetPlans).not.toHaveBeenCalled();
  expect(mockComplete).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText('Close details'));
  expect(screen.queryByText('Details: daily_walk')).toBeNull();
});

it('does not send a plan request without separate permission for personal details', () => {
  mockSharePersonalDetails = false;
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  expect(mockGenerate).not.toHaveBeenCalled();
  expect(screen.getByText('aiSharing.requiredForPlan')).toBeTruthy();
  fireEvent.press(screen.getByText('onboarding.skipAIPlan'));
  expect(mockComplete).toHaveBeenCalledWith(true);
});

it.each([true, false])('only provides archives when the optional permission is %s', async share => {
  mockShareArchivedPlans = share;
  mockGenerate.mockResolvedValue({ plans: mockPlans });
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  await waitFor(() => expect(mockGenerate).toHaveBeenCalled());
  expect(mockGenerate.mock.calls[0][7]).toEqual(share ? mockArchives : undefined);
});
it('does not generate without interests consent', () => {
  mockShareInterests = false;
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByText('createPlan.createAIPlan'));
  expect(mockGenerate).not.toHaveBeenCalled();
});

it('shows loading and disables the page button immediately after modal confirmation', async () => {
  let resolve: (value: any) => void = () => {};
  mockGenerate.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  mockShareInterests = false;
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByTestId('generate-plan-button'));
  expect(screen.getByText('Confirm AI sharing')).toBeTruthy();
  mockShareInterests = true;
  screen.rerender(<OnboardingPlan />);
  fireEvent.press(screen.getByText('Confirm AI sharing'));
  expect(screen.queryByText('Confirm AI sharing')).toBeNull();
  expect(screen.getByTestId('generate-plan-button').props.accessibilityState.disabled).toBe(true);
  expect(screen.getByTestId('generate-plan-button').props.accessibilityState.busy).toBe(true);
  expect(screen.getAllByText('createPlan.creatingAIPlan').length).toBeGreaterThan(0);
  fireEvent.press(screen.getByTestId('generate-plan-button'));
  expect(mockGenerate).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ plans: mockPlans }));
  expect(screen.getByTestId('generate-plan-button').props.accessibilityState.disabled).toBe(false);
});

it('blocks duplicate requests even before React has rendered the loading state', async () => {
  let resolve: (value: any) => void = () => {};
  mockGenerate.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  const screen = render(<OnboardingPlan />);
  const press = screen.UNSAFE_getByType(require('@/components/ui/GoldenGlowButton').GoldenGlowButton).props.onPress;
  act(() => {
    press();
    press();
  });
  expect(mockGenerate).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ plans: mockPlans }));
});

it.each([true, false])('selects the dashboard welcome based on whether an AI tip was accepted: %s', approved => {
  mockTempPlans = { ...mockPlans, training: [{ tipId: 'daily_walk' }] };
  const screen = render(<OnboardingPlan />);
  if (!approved) fireEvent.press(screen.getByLabelText('createPlan.selectTip'));
  fireEvent.press(screen.getByText('createPlan.acceptAIPlan'));
  if (approved) {
    expect(mockSetOnboardingStep).toHaveBeenCalledWith(5);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  } else {
    expect(mockSetPlans).not.toHaveBeenCalled();
    expect(mockSetOnboardingStep).not.toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('onboarding.skipAIPlan'));
    expect(mockSetOnboardingStep).toHaveBeenCalledWith(6);
    expect(mockReplace).toHaveBeenCalledWith('/dashboard');
  }
});

it('cannot accept an empty generated plan', () => {
  mockTempPlans = mockPlans;
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByText('createPlan.acceptAIPlan'));
  expect(mockSetPlans).not.toHaveBeenCalled();
  expect(mockComplete).not.toHaveBeenCalled();
});

it('marks tip cards red after accepting without selections and clears errors when a tip is selected', () => {
  mockTempPlans = { ...mockPlans, training: [{ tipId: 'daily_walk' }] };
  const screen = render(<OnboardingPlan />);
  fireEvent.press(screen.getByLabelText('createPlan.selectTip'));
  expect(screen.queryByText('createPlan.selectAtLeastOne')).toBeNull();
  fireEvent.press(screen.getByText('createPlan.acceptAIPlan'));
  expect(screen.getByText('createPlan.selectAtLeastOne')).toBeTruthy();
  const cards = () => screen.UNSAFE_getAllByType(require('@/components/ui/Card').Card);
  expect(cards().filter(card => StyleSheet.flatten(card.props.style)?.borderColor === 'red')).toHaveLength(1);
  expect(mockComplete).not.toHaveBeenCalled();
  fireEvent.press(screen.getByLabelText('createPlan.selectTip'));
  expect(screen.queryByText('createPlan.selectAtLeastOne')).toBeNull();
  expect(cards().filter(card => StyleSheet.flatten(card.props.style)?.borderColor === 'red')).toHaveLength(0);
  fireEvent.press(screen.getByText('createPlan.acceptAIPlan'));
  expect(mockComplete).toHaveBeenCalledWith(true);
});
