import React from 'react';
import { render } from '@testing-library/react-native';
import BiohackerDashboard from '../dashboard';
import * as StorageContext from '../../context/StorageContext';

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ 
    push: jest.fn(),
    replace: jest.fn(), 
    back: jest.fn() 
  })),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'levels:biohacker': 'Biohacker',
        'levels:advanced_biohacker': 'Advanced Biohacker',
        'levels:master_biohacker': 'Master Biohacker',
        'goals:improve_sleep.title': 'Improve Sleep',
        'goals:boost_energy.title': 'Boost Energy',
        'goals:enhance_focus.title': 'Enhance Focus',
        'common:goals.selectGoal': 'Select Goal',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock supplements
jest.mock('@/locales/supplements', () => ({
  useSupplements: jest.fn(() => [
    { id: 'supp1', name: 'Magnesium' },
    { id: 'supp2', name: 'Vitamin D3' },
  ]),
}));

// Mock goals and main goals
jest.mock('@/locales/goals', () => ({
  goals: [
    {
      id: 'goal1',
      mainGoalIds: ['improve_sleep'],
      title: 'Sleep Optimization',
      level: 1,
      xp: 100,
      supplements: [{ id: 'supp1' }],
    },
    {
      id: 'goal2', 
      mainGoalIds: ['boost_energy'],
      title: 'Energy Boost',
      level: 1,
      xp: 150,
      supplements: [{ id: 'supp2' }],
    },
  ],
}));

jest.mock('@/locales/areas', () => ({
  areas: [
    { id: 'improve_sleep', icon: 'moon', title: 'Sleep' },
    { id: 'boost_energy', icon: 'battery', title: 'Energy' },
  ],
}));

jest.mock('@/locales/levels', () => ({
  levels: [
    { level: 1, requiredXP: 0, titleKey: 'biohacker' },
    { level: 2, requiredXP: 500, titleKey: 'advanced_biohacker' },
    { level: 3, requiredXP: 1500, titleKey: 'master_biohacker' },
  ],
}));

// Mock AppCard component
jest.mock('@/components/ui/AppCard', () => {
  return function MockAppCard({ title, description, onPress }: any) {
    const { Text, TouchableOpacity } = require('react-native');
    return (
      <TouchableOpacity onPress={onPress} testID="app-card">
        <Text testID="card-title">{title}</Text>
        <Text testID="card-description">{description}</Text>
      </TouchableOpacity>
    );
  };
});

// Mock ProgressBarWithLabel component
jest.mock('@/components/ui/ProgressbarWithLabel', () => {
  return function MockProgressBarWithLabel({ progress, label }: any) {
    const { Text, View } = require('react-native');
    return (
      <View testID="progress-bar">
        <Text testID="progress-label">{label}</Text>
        <Text testID="progress-value">{Math.round(progress * 100)}%</Text>
      </View>
    );
  };
});

const mockStorageContext = {
  plans: {
    supplements: [],
    training: [
      { mainGoalId: 'improve_sleep', tipId: 'goal1', startedAt: new Date().toISOString(), planCategory: 'training' },
    ],
    nutrition: [],
  },
  setPlans: jest.fn(),
  hasVisitedChat: false,
  setHasVisitedChat: jest.fn(),
  shareHealthPlan: false,
  setShareHealthPlan: jest.fn(),
  takenDates: {},
  setTakenDates: jest.fn(),
  myGoals: ['improve_sleep', 'boost_energy'],
  setMyGoals: jest.fn(),
  activeGoals: [
    { mainGoalId: 'improve_sleep', tipId: 'goal1', startedAt: new Date().toISOString(), planCategory: 'training' },
  ],
  errorMessage: null,
  setErrorMessage: jest.fn(),
  hasCompletedOnboarding: true,
  setHasCompletedOnboarding: jest.fn(),
  isInitialized: true,
  onboardingStep: 0,
  setOnboardingStep: jest.fn(),
  myXP: 250,
  setMyXP: jest.fn(),
  myLevel: 1,
  setMyLevel: jest.fn(),
  levelUpModalVisible: false,
  setLevelUpModalVisible: jest.fn(),
  newLevelReached: null,
  dailyNutritionSummaries: {},
  setDailyNutritionSummaries: jest.fn(),
};

describe('BiohackerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue(mockStorageContext);
  });

  it('renders dashboard title correctly', () => {
    const { getByText } = render(<BiohackerDashboard />);
    expect(getByText('BIOHAXING')).toBeTruthy();
  });

  it('displays current level correctly', () => {
    const { getByText } = render(<BiohackerDashboard />);
    expect(getByText('LEVEL 1')).toBeTruthy();
    expect(getByText('Biohacker')).toBeTruthy();
  });

  it('shows XP progress correctly', () => {
    const { getByTestId } = render(<BiohackerDashboard />);
    const progressLabel = getByTestId('progress-label');
    expect(progressLabel.props.children).toBe('250 / 500 XP');
  });

  it('renders goal cards for selected main goals', () => {
    const { getAllByTestId } = render(<BiohackerDashboard />);
    const cards = getAllByTestId('app-card');
    expect(cards).toHaveLength(2); // improve_sleep and boost_energy
  });

  it('shows goal titles correctly', () => {
    const { getByText } = render(<BiohackerDashboard />);
    expect(getByText('Improve Sleep')).toBeTruthy();
    expect(getByText('Boost Energy')).toBeTruthy();
  });

  it('displays supplement names in goal descriptions', () => {
    const { getByText } = render(<BiohackerDashboard />);
    expect(getByText('Magnesium')).toBeTruthy();
    expect(getByText('Vitamin D3')).toBeTruthy();
  });

  it('handles empty supplements gracefully', () => {
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue({
      ...mockStorageContext,
      activeGoals: [],
    });

    const { getByText } = render(<BiohackerDashboard />);
    expect(getByText('BIOHAXING')).toBeTruthy();
  });

  it('calculates progress percentage correctly', () => {
    const { getByTestId } = render(<BiohackerDashboard />);
    const progressValue = getByTestId('progress-value');
    // 250 XP out of 500 XP = 50%
    expect(progressValue.props.children).toEqual([50, '%']);
  });
});