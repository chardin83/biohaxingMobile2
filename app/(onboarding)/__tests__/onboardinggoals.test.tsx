import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { AllProviders } from '@/test-utils/Providers';

import * as StorageContext from '../../context/StorageContext';
import OnboardingGoals from '../onboardinggoals';

const mockSetHasCompletedOnboarding = jest.fn();
const mockRouterPush = jest.fn();

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockRouterPush,
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common:areas.selectAreas': 'Select Areas',
        'common:onboarding.continue': 'Continue',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock AppButton component
jest.mock('@/components/ui/AppButton', () => {
  return function MockAppButton({ title, onPress, testID }: any) {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID || 'app-button'}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  };
});

const mockStorageContext = {
  plans: {
    supplements: [],
    training: [],
    nutrition: [],
    other: [],
    reasonSummary: { text: '', createdAt: '' },
  },
  setPlans: jest.fn(),
  tempPlans: {
    supplements: [],
    training: [],
    nutrition: [],
    other: [],
    reasonSummary: { text: '', createdAt: '' },
  },
  setTempPlans: jest.fn(),
  hasVisitedChat: false,
  setHasVisitedChat: jest.fn(),
  shareHealthPlan: false,
  setShareHealthPlan: jest.fn(),
  takenDates: {},
  setTakenDates: jest.fn(),
  myGoals: [],
  setMyGoals: jest.fn(),
  activeGoals: [],
  errorMessage: null,
  setErrorMessage: jest.fn(),
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: mockSetHasCompletedOnboarding,
  isInitialized: true,
  onboardingStep: 0,
  setOnboardingStep: jest.fn(),
  myXP: 0,
  setMyXP: jest.fn(),
  myLevel: 1,
  setMyLevel: jest.fn(),
  levelUpModalVisible: false,
  setLevelUpModalVisible: jest.fn(),
  newLevelReached: null,
  dailyNutritionSummaries: {},
  setDailyNutritionSummaries: jest.fn(),

  clearNewLevelReached: jest.fn(),
  viewedTips: [],
  setViewedTips: jest.fn(),
  addTipView: jest.fn(),
  completedGoals: [],
  setCompletedGoals: jest.fn(),
  completedGoalDates: {},
  setCompletedGoalDates: jest.fn(),
  completedGoalXP: {},
  setCompletedGoalXP: jest.fn(),
  completedGoalStreaks: {},
  setCompletedGoalStreaks: jest.fn(),
  completedGoalStreakDates: {},
  setCompletedGoalStreakDates: jest.fn(),
  showMusic: false,
  setShowMusic: jest.fn(),

  // Add mocks for missing properties required by StorageContextType
  incrementTipChat: jest.fn(),
  addChatMessageXP: jest.fn(),
  setTipVerdict: jest.fn(),
  trainingPlanSettings: {},
  setTrainingPlanSettings: jest.fn(),
  tipVerdicts: {},
};

describe('OnboardingGoals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue(mockStorageContext);
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(ui, { wrapper: AllProviders });

  it('renders the screen title correctly', async () => {
    const { getByText } = renderWithProviders(<OnboardingGoals />);
    await waitFor(() => {
      expect(getByText('Select Areas')).toBeTruthy();
    });
  });

  it('renders the continue button', async () => {
    const { getByText } = renderWithProviders(<OnboardingGoals />);
    await waitFor(() => {
      expect(getByText('Continue')).toBeTruthy();
    });
  });

  it('calls setHasCompletedOnboarding and navigates when continue is pressed', async () => {
    const { getByText } = renderWithProviders(<OnboardingGoals />);
    const continueButton = getByText('Continue');

    await act(async () => {
      fireEvent.press(continueButton);
    });

    expect(mockSetHasCompletedOnboarding).toHaveBeenCalledWith(true);
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('has proper layout structure', async () => {
    const { getByText } = renderWithProviders(<OnboardingGoals />);
    await waitFor(() => {
      // Check that all elements are present
      expect(getByText('Select Areas')).toBeTruthy();
      expect(getByText('Continue')).toBeTruthy();
    });
  });

  it('applies correct styling to the title', async () => {
    const { getByText } = renderWithProviders(<OnboardingGoals />);
    const titleElement = getByText('Select Areas');

    // Slå ihop alla style-objekt i arrayen
    const mergedStyle = Array.isArray(titleElement.props.style)
      ? Object.assign({}, ...titleElement.props.style)
      : titleElement.props.style;

    await waitFor(() => {
      expect(mergedStyle).toEqual(
        expect.objectContaining({
          fontSize: 22,
          fontWeight: 'bold',
          marginBottom: 20,
        })
      );
    });
  });

  it('handles button press correctly', async () => {
    const { getByTestId } = renderWithProviders(<OnboardingGoals />);
    const button = getByTestId('app-button');

    await act(async () => {
      fireEvent.press(button);
    });

    expect(mockSetHasCompletedOnboarding).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });
});
