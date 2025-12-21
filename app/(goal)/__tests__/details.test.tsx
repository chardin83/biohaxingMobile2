import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import GoalDetailScreen from '../details';
import * as StorageContext from '../../context/StorageContext';
import * as useSupplementsModule from '@/locales/supplements';
import { useLocalSearchParams } from 'expo-router';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn(), back: jest.fn() })),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0 })),
}));
jest.mock('@/locales/supplements', () => ({ useSupplements: jest.fn() }));
jest.mock('@/locales/mainGoals', () => ({ mainGoals: [{ id: 'main1', icon: 'target', title: 'Main Goal' }] }));
jest.mock('@/locales/goals', () => ({
  goals: [
    {
      id: 'goal1',
      mainGoalIds: ['main1'],
      title: 'Goal Title',
      xp: 100,
      supplements: [{ id: 'supp1' }],
      taskInfo: { instructions: 'Do something', duration: { amount: 7, unit: 'days' } },
      information: { text: 'info.text', author: 'info.author' },
      //analyzePrompt: 'analyze',
      startPrompt: 'start',
    },
  ],
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'goals:main1.title') return 'Main Goal';
      if (key === 'goals:Goal Title') return 'Goal Title';
      if (key === 'goals:info.text') return 'info.text';
      if (key === 'goals:info.author') return 'info.author';
      if (key === 'goals:Do something') return 'Do something';
      if (key === 'common:goalDetails.taskInfo') return 'Task Info';
      if (key === 'common:goalDetails.start') return 'start';
      if (key === 'common:goalDetails.finish') return 'finish';
      if (key === 'common:goalDetails.analyze') return 'analyze';
      if (key === 'common:goalDetails.skip') return 'skip';
      if (key === 'common:goalDetails.analyzeHint') return 'analyzeHint';
      if (key === 'common:goalDetails.information') return 'information';
      if (key === 'common:goalDetails.aiInsights') return 'aiInsights';
      if (key === 'common:general.areYouSure') return 'areYouSure';
      if (key === 'common:goalDetails.skipConfirmYes') return 'skipConfirmYes';
      if (key === 'common:goalDetails.skipConfirmBody') return 'skipConfirmBody';
      if (key === 'common:selectGoal.description') return 'Beskrivning';
      if (key === 'common:goalDetails.durationUnits.days') return 'dagar';
      return key;
    },
  }),
}));

const mockSetActiveGoals = jest.fn();
const mockSetFinishedGoals = jest.fn();
const mockSetMyXP = jest.fn();

const fullMockStorageContext = {
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
  setActiveGoals: mockSetActiveGoals,
  finishedGoals: [],
  setFinishedGoals: mockSetFinishedGoals,
  errorMessage: null,
  setErrorMessage: jest.fn(),
  hasCompletedOnboarding: false,
  setHasCompletedOnboarding: jest.fn(),
  isInitialized: true,
  onboardingStep: 0,
  setOnboardingStep: jest.fn(),
  myXP: 0,
  setMyXP: mockSetMyXP,
  myLevel: 1,
  setMyLevel: jest.fn(),
  levelUpModalVisible: false,
  setLevelUpModalVisible: jest.fn(),
  newLevelReached: null,
  dailyNutritionSummaries: {},
  setDailyNutritionSummaries: jest.fn(),
};

describe('GoalDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mainGoalId: 'main1', goalId: 'goal1' });
    (useSupplementsModule.useSupplements as jest.Mock).mockReturnValue([{ id: 'supp1', name: 'Supp 1' }]);
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue({
      ...fullMockStorageContext,
      setActiveGoals: mockSetActiveGoals,
      setFinishedGoals: mockSetFinishedGoals,
      setMyXP: mockSetMyXP,
      activeGoals: [],
      finishedGoals: [],
    });
  });

  it('renders goal details', () => {
    const { getByText } = render(<GoalDetailScreen />);
    expect(getByText(/Main Goal/i)).toBeTruthy();
    expect(getByText(/Supp 1/i)).toBeTruthy();
    expect(getByText(/100 XP/i)).toBeTruthy();
    expect(getByText(/Do something/i)).toBeTruthy();
  });

  it('shows start button and triggers start modal', () => {
    const { getByText } = render(<GoalDetailScreen />);
    const startBtn = getByText(/start/i);
    expect(startBtn).toBeTruthy();
    fireEvent.press(startBtn);
  });

  it('shows not found if goal is missing', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ mainGoalId: 'main1', goalId: 'missing' });
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue({
      ...fullMockStorageContext,
    });
    const { getByText } = render(<GoalDetailScreen />);
    expect(getByText(/Goal not found/i)).toBeTruthy();
  });

  it('calls setFinishedGoals if no analyzeprompt and setMyXP on finish', () => {
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue({
      ...fullMockStorageContext,
      activeGoals: [
        { mainGoalId: 'main1', goalId: 'goal1', startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
      ],
      setActiveGoals: mockSetActiveGoals,
      setFinishedGoals: mockSetFinishedGoals,
      setMyXP: mockSetMyXP,
      finishedGoals: [],
    });
    const { getByText } = render(<GoalDetailScreen />);

    const finishBtn = getByText(/finish/i);
    expect(finishBtn).toBeTruthy();
    fireEvent.press(finishBtn!);

    expect(mockSetFinishedGoals).toHaveBeenCalled();
    expect(mockSetMyXP).toHaveBeenCalledWith(expect.any(Function));
  });
});
