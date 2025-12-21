import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyGoalsSelector from '../MyGoalsSelector';
import * as StorageContext from '../../app/context/StorageContext';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'goals:improve_sleep.title': 'Improve Sleep',
        'goals:improve_sleep.description': 'Better sleep quality',
        'goals:boost_energy.title': 'Boost Energy',
        'goals:boost_energy.description': 'Increase energy levels',
        'goals:enhance_focus.title': 'Enhance Focus',
        'goals:enhance_focus.description': 'Better concentration',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock main goals
jest.mock('@/locales/mainGoals', () => ({
  mainGoals: [
    { id: 'improve_sleep', icon: 'moon', title: 'Sleep' },
    { id: 'boost_energy', icon: 'battery', title: 'Energy' },
    { id: 'enhance_focus', icon: 'brain', title: 'Focus' },
  ],
}));

// Mock AppCard component
jest.mock('@/components/ui/AppCard', () => {
  return function MockAppCard({ title, description, isActive, onPress }: any) {
    const { TouchableOpacity, Text, View } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID={`app-card-${title.toLowerCase().replace(' ', '-')}`}>
        <View>
          <Text testID="card-title">{title}</Text>
          <Text testID="card-description">{description}</Text>
          <Text testID="card-active">{isActive ? 'active' : 'inactive'}</Text>
        </View>
      </TouchableOpacity>
    );
  };
});

const mockSetMyGoals = jest.fn();

const mockStorageContext = {
  plans: [],
  setPlans: jest.fn(),
  hasVisitedChat: false,
  setHasVisitedChat: jest.fn(),
  shareHealthPlan: false,
  setShareHealthPlan: jest.fn(),
  takenDates: {},
  setTakenDates: jest.fn(),
  myGoals: ['improve_sleep'],
  setMyGoals: mockSetMyGoals,
  activeGoals: [],
  setActiveGoals: jest.fn(),
  finishedGoals: [],
  setFinishedGoals: jest.fn(),
  errorMessage: null,
  setErrorMessage: jest.fn(),
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: jest.fn(),
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

describe('MyGoalsSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue(mockStorageContext);
  });

  it('renders all goal cards', () => {
    const { getByText } = render(<MyGoalsSelector />);
    
    expect(getByText('Improve Sleep')).toBeTruthy();
    expect(getByText('Boost Energy')).toBeTruthy();
    expect(getByText('Enhance Focus')).toBeTruthy();
  });

  it('displays goal descriptions correctly', () => {
    const { getByText } = render(<MyGoalsSelector />);
    
    expect(getByText('Better sleep quality')).toBeTruthy();
    expect(getByText('Increase energy levels')).toBeTruthy();
    expect(getByText('Better concentration')).toBeTruthy();
  });

  it('shows active state for selected goals', () => {
    const { getAllByTestId } = render(<MyGoalsSelector />);
    
    const activeStates = getAllByTestId('card-active');
    expect(activeStates[0].props.children).toBe('active'); // improve_sleep is selected
    expect(activeStates[1].props.children).toBe('inactive'); // boost_energy is not selected
    expect(activeStates[2].props.children).toBe('inactive'); // enhance_focus is not selected
  });

  it('calls setMyGoals when a goal is selected', () => {
    const { getByTestId } = render(<MyGoalsSelector />);
    
    const energyCard = getByTestId('app-card-boost-energy');
    fireEvent.press(energyCard);
    
    expect(mockSetMyGoals).toHaveBeenCalledWith(expect.any(Function));
  });

  it('calls setMyGoals when a goal is deselected', () => {
    const { getByTestId } = render(<MyGoalsSelector />);
    
    const sleepCard = getByTestId('app-card-improve-sleep');
    fireEvent.press(sleepCard);
    
    expect(mockSetMyGoals).toHaveBeenCalledWith(expect.any(Function));
  });

  it('calls onGoalSelected callback when provided', () => {
    const mockOnGoalSelected = jest.fn();
    const { getByTestId } = render(<MyGoalsSelector onGoalSelected={mockOnGoalSelected} />);
    
    const focusCard = getByTestId('app-card-enhance-focus');
    fireEvent.press(focusCard);
    
    expect(mockOnGoalSelected).toHaveBeenCalledWith({
      id: 'enhance_focus',
      icon: 'brain',
      title: 'Focus',
    });
  });

  it('toggles goal selection correctly when adding new goal', () => {
    const { getByTestId } = render(<MyGoalsSelector />);
    
    const energyCard = getByTestId('app-card-boost-energy');
    fireEvent.press(energyCard);
    
    // Verify the function was called with a function that adds the goal
    expect(mockSetMyGoals).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the function logic by calling it with current state
    const setMyGoalsFunction = mockSetMyGoals.mock.calls[0][0];
    const currentGoals = ['improve_sleep'];
    const newGoals = setMyGoalsFunction(currentGoals);
    
    expect(newGoals).toEqual(['improve_sleep', 'boost_energy']);
  });

  it('toggles goal selection correctly when removing existing goal', () => {
    const { getByTestId } = render(<MyGoalsSelector />);
    
    const sleepCard = getByTestId('app-card-improve-sleep');
    fireEvent.press(sleepCard);
    
    expect(mockSetMyGoals).toHaveBeenCalledWith(expect.any(Function));
    
    // Test the function logic by calling it with current state
    const setMyGoalsFunction = mockSetMyGoals.mock.calls[0][0];
    const currentGoals = ['improve_sleep'];
    const newGoals = setMyGoalsFunction(currentGoals);
    
    expect(newGoals).toEqual([]);
  });

  it('renders with empty goals array', () => {
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue({
      ...mockStorageContext,
      myGoals: [],
    });

    const { getByText, getAllByTestId } = render(<MyGoalsSelector />);
    
    // All goals should be rendered
    expect(getByText('Improve Sleep')).toBeTruthy();
    expect(getByText('Boost Energy')).toBeTruthy();
    expect(getByText('Enhance Focus')).toBeTruthy();
    
    // All should be inactive
    const activeStates = getAllByTestId('card-active');
    activeStates.forEach(state => {
      expect(state.props.children).toBe('inactive');
    });
  });

  it('works without onGoalSelected callback', () => {
    const { getByTestId } = render(<MyGoalsSelector />);
    
    const focusCard = getByTestId('app-card-enhance-focus');
    
    // Should not throw error when onGoalSelected is not provided
    expect(() => fireEvent.press(focusCard)).not.toThrow();
    expect(mockSetMyGoals).toHaveBeenCalled();
  });
});