// Mock VerdictSelector to avoid invalid element type error
import { render, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import * as useSupplementsModule from '@/locales/supplements';
import { AllProviders } from '@/test-utils/Providers';

import * as StorageContext from '../../../../context/StorageContext';
import GoalDetailScreen from '../[areaId]/details';

jest.mock('@/components/VerdictSelector', () => 'VerdictSelector');

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => ({
  __esModule: true,
  default: (props: any) => require('react').createElement('Text', props, props.name),
}));

jest.mock('react-native-vector-icons/FontAwesome', () => ({
  __esModule: true,
  default: (props: any) => require('react').createElement('Text', props, props.name),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn(), back: jest.fn() })),
  useLocalSearchParams: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0 })),
}));
jest.mock('@/locales/supplements', () => ({ useSupplements: jest.fn() }));
jest.mock('@/locales/areas', () => ({ areas: [{ id: 'main1', icon: 'target', title: 'Main Goal' }] }));
jest.mock('@/locales/tips', () => ({
  tips: [
    {
      id: 'goal1',
      mainGoalIds: ['main1'],
      title: 'Goal Title',
      xp: 100,
      supplements: [{ id: 'supp1' }],
      taskInfo: { instructions: 'Do something', duration: { amount: 7, unit: 'days' } },
      information: { text: 'info.text', author: 'info.author' },
      startPrompt: 'start',
      areas: [{ id: 'main1' }],
    },
  ],
}));
jest.mock('react-i18next', () => ({
  useTranslation: () => {
    const translations: Record<string, string> = {
      'areas:main1.title': 'Main Goal',
      'areas:Goal Title': 'Goal Title',
      'areas:info.text': 'info.text',
      'areas:info.author': 'info.author',
      'areas:Do something': 'Do something',
      'common:goalDetails.taskInfo': 'Task Info',
      'common:goalDetails.start': 'start',
      'common:goalDetails.finish': 'finish',
      'common:goalDetails.analyze': 'analyze',
      'common:goalDetails.skip': 'skip',
      'common:goalDetails.analyzeHint': 'analyzeHint',
      'common:goalDetails.information': 'information',
      'common:goalDetails.aiInsights': 'aiInsights',
      'common:general.areYouSure': 'areYouSure',
      'common:goalDetails.skipConfirmYes': 'skipConfirmYes',
      'common:goalDetails.skipConfirmBody': 'skipConfirmBody',
      'common:selectGoal.description': 'Beskrivning',
      'common:goalDetails.durationUnits.days': 'dagar',
    };
    return {
      t: (key: string) => translations[key] ?? key,
    };
  },
}));

const mockSetMyXP = jest.fn();
const mockSetPlans = jest.fn();

const fullMockStorageContext = {
  plans: { supplements: [], training: [], nutrition: [], other: [], reasonSummary: '' },
  setPlans: mockSetPlans,
  tempPlans: { supplements: [], training: [], nutrition: [], other: [], reasonSummary: '' },
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
  setHasCompletedOnboarding: jest.fn(),
  isInitialized: true,
  onboardingStep: 0,
  setOnboardingStep: jest.fn(),
  myXP: 100,
  setMyXP: mockSetMyXP,
  myLevel: 1,
  setMyLevel: jest.fn(),
  levelUpModalVisible: false,
  setLevelUpModalVisible: jest.fn(),
  newLevelReached: null,
  dailyNutritionSummaries: {},
  setDailyNutritionSummaries: jest.fn(),

  // Add missing StorageContextType properties (mock implementations)
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


describe('GoalDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ areaId: 'main1', tipId: 'goal1' });
    (useSupplementsModule.useSupplements as jest.Mock).mockReturnValue([{ id: 'supp1', name: 'Supp 1' }]);
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue({
      ...fullMockStorageContext,
      setMyXP: mockSetMyXP,
      activeGoals: [],
    });
  });

  const renderWithProviders = (ui: React.ReactElement) =>
    render(ui, { wrapper: AllProviders });

  it('renders goal details', async () => {
    const { getAllByText } = renderWithProviders(<GoalDetailScreen />);
    await waitFor(() => {
      expect(getAllByText(/Main Goal/i).length).toBeGreaterThan(0);
      expect(getAllByText(/Supp 1/i).length).toBeGreaterThan(0);
      expect(getAllByText(/XP/i).length).toBeGreaterThan(0);
    });
  });

  it('shows not found if goal is missing', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ areaId: 'main1', tipId: 'missing' });
    jest.spyOn(StorageContext, 'useStorage').mockReturnValue({
      ...fullMockStorageContext,
    });
     await waitFor(() => {
      const { getByText } = renderWithProviders(<GoalDetailScreen />);
      expect(getByText(/Goal not found/i)).toBeTruthy();
    });
  });
  
  it('renders without crashing (smoke test)', async () => {
    const { toJSON } = renderWithProviders(<GoalDetailScreen />);
    await waitFor(() => {
      expect(toJSON()).toBeTruthy();
    });
  });

  it('matches snapshot', async () => {
    const { toJSON } = renderWithProviders(<GoalDetailScreen />);
    await waitFor(() => {
      expect(toJSON()).toMatchSnapshot();
    });
  });
});
