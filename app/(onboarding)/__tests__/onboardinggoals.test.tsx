import { fireEvent,render } from '@testing-library/react-native';
import React from 'react';

import * as StorageContext from '../../context/StorageContext';
import OnboardingGoals from '../onboardinggoals';

const mockSetHasCompletedOnboarding = jest.fn();
const mockRouterPush = jest.fn();

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ 
    push: mockRouterPush,
    replace: jest.fn(), 
    back: jest.fn() 
  })),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'common:goals.selectGoal': 'Select Goal',
        'common:onboarding.continue': 'Continue',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock MyGoalsSelector component
jest.mock('@/components/MyGoalsSelector', () => {
  return function MockMyGoalsSelector() {
    const { Text, View } = require('react-native');
    return (
      <View testID="my-goals-selector">
        <Text>Mock Goals Selector</Text>
      </View>
    );
  };
});

// Mock AppButton component
jest.mock('@/components/ui/AppButton', () => {
  return function MockAppButton({ title, onPress, variant, testID }: any) {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={testID || 'app-button'}>
        <Text>{title}</Text>
      </TouchableOpacity>
    );
  };
});

const mockStorageContext = {
  plans: [],
  setPlans: jest.fn(),
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
};

describe('OnboardingGoals', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue(mockStorageContext);
  });

  it('renders the screen title correctly', () => {
    const { getByText } = render(<OnboardingGoals />);
    expect(getByText('Select Goal')).toBeTruthy();
  });

  it('renders MyGoalsSelector component', () => {
    const { getByTestId } = render(<OnboardingGoals />);
    expect(getByTestId('my-goals-selector')).toBeTruthy();
  });

  it('renders the continue button', () => {
    const { getByText } = render(<OnboardingGoals />);
    expect(getByText('Continue')).toBeTruthy();
  });

  it('calls setHasCompletedOnboarding and navigates when continue is pressed', () => {
    const { getByText } = render(<OnboardingGoals />);
    const continueButton = getByText('Continue');
    
    fireEvent.press(continueButton);
    
    expect(mockSetHasCompletedOnboarding).toHaveBeenCalledWith(true);
    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard');
  });

  it('has proper layout structure', () => {
    const { getByText, getByTestId } = render(<OnboardingGoals />);
    
    // Check that all elements are present
    expect(getByText('Select Goal')).toBeTruthy();
    expect(getByTestId('my-goals-selector')).toBeTruthy();
    expect(getByText('Continue')).toBeTruthy();
  });

  it('applies correct styling to the title', () => {
    const { getByText } = render(<OnboardingGoals />);
    const titleElement = getByText('Select Goal');
    
    expect(titleElement.props.style).toEqual(
      expect.objectContaining({
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
      })
    );
  });

  it('handles button press correctly', () => {
    const { getByTestId } = render(<OnboardingGoals />);
    const button = getByTestId('app-button');
    
    fireEvent.press(button);
    
    expect(mockSetHasCompletedOnboarding).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
  });
});