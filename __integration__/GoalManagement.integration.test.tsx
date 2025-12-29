import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { StorageProvider, useStorage } from '../app/context/StorageContext';
import GoalDetailScreen from '../app/(goal)/[mainGoalId]/details';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as useSupplementsModule from '@/locales/supplements';

// Mock external dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ replace: jest.fn(), back: jest.fn() })),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0 })),
}));

jest.mock('@/locales/supplements', () => ({ 
  useSupplements: jest.fn(() => [
    { id: 'supp1', name: 'Vitamin D' },
    { id: 'supp2', name: 'Omega-3' }
  ])
}));

jest.mock('@/locales/mainGoals', () => ({ 
  mainGoals: [
    { id: 'main1', icon: 'target', title: 'Energy Boost' }
  ]
}));

jest.mock('@/locales/goals', () => ({
  goals: [
    {
      id: 'goal1',
      mainGoalIds: ['main1'],
      title: 'Morning Energy',
      xp: 100,
      supplements: [{ id: 'supp1' }],
      taskInfo: { 
        instructions: 'Take vitamin D every morning', 
        duration: { amount: 7, unit: 'days' } 
      },
      information: { text: 'info.text', author: 'info.author' },
      startPrompt: 'Start taking your vitamin D supplement',
    },
  ],
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'goals:main1.title': 'Energy Boost',
        'goals:Morning Energy': 'Morning Energy',
        'goals:info.text': 'Vitamin D helps with energy',
        'goals:info.author': 'Dr. Health',
        'goals:Take vitamin D every morning': 'Take vitamin D every morning',
        'common:goalDetails.taskInfo': 'Task Info',
        'common:goalDetails.start': 'Start Goal',
        'common:goalDetails.finish': 'Complete Goal',
        'common:goalDetails.analyze': 'Analyze',
        'common:goalDetails.skip': 'Skip Goal',
        'common:goalDetails.analyzeHint': 'Analyze your progress',
        'common:goalDetails.information': 'Information',
        'common:goalDetails.aiInsights': 'AI Insights',
        'common:general.areYouSure': 'Are you sure?',
        'common:goalDetails.skipConfirmYes': 'Yes, skip',
        'common:goalDetails.skipConfirmBody': 'Are you sure you want to skip this goal?',
        'common:selectGoal.description': 'Description',
        'common:goalDetails.durationUnits.days': 'days',
      };
      return translations[key] || key;
    },
  }),
}));

// Integration test for Goal Management workflow
describe('Goal Management Integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ 
      mainGoalId: 'main1', 
      goalId: 'goal1' 
    });
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('should handle complete goal workflow with real storage persistence', async () => {
    let contextValues: any = {};
    
    // Create a test component that exposes context values
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return null;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    // Wait for context initialization
    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    // Step 1: Start the goal manually (simulating the confirmStartGoal function)
    const goalToStart = {
      mainGoalId: 'main1',
      goalId: 'goal1',
      startedAt: new Date().toISOString()
    };

    act(() => {
      contextValues.setActiveGoals([goalToStart]);
    });

    // Wait for active goal to be set
    await waitFor(() => {
      expect(contextValues.activeGoals).toHaveLength(1);
      expect(contextValues.activeGoals[0]).toMatchObject({
        mainGoalId: 'main1',
        goalId: 'goal1'
      });
    });

    // Wait for AsyncStorage operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify persistence in AsyncStorage
    const storedActiveGoals = await AsyncStorage.getItem('activeGoals');
    const parsedActiveGoals = JSON.parse(storedActiveGoals || '[]');
    expect(parsedActiveGoals).toHaveLength(1);
    expect(parsedActiveGoals[0]).toMatchObject({
      mainGoalId: 'main1',
      goalId: 'goal1'
    });

    // Step 2: Complete the goal (simulating handleFinishGoal function)
    const finishedGoal = {
      mainGoalId: 'main1',
      goalId: 'goal1',
      finished: new Date().toISOString()
    };

    act(() => {
      contextValues.setFinishedGoals([finishedGoal]);
      contextValues.setActiveGoals([]); // Remove from active
      contextValues.setMyXP((prev: number) => prev + 100); // Add XP
    });

    // Wait for goal completion to be processed
    await waitFor(() => {
      expect(contextValues.finishedGoals).toHaveLength(1);
      expect(contextValues.myXP).toBe(100); // Should have gained XP
      expect(contextValues.activeGoals).toHaveLength(0);
    });

    // Wait for AsyncStorage operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify finished goal persistence
    const storedFinishedGoals = await AsyncStorage.getItem('finishedGoals');
    const parsedFinishedGoals = JSON.parse(storedFinishedGoals || '[]');
    expect(parsedFinishedGoals).toHaveLength(1);
    expect(parsedFinishedGoals[0]).toMatchObject({
      mainGoalId: 'main1',
      goalId: 'goal1'
    });

    // Verify XP persistence
    const storedXP = await AsyncStorage.getItem('myXP');
    expect(storedXP).toBe('100');

    // Verify active goal was removed
    const storedActiveGoalsAfterCompletion = await AsyncStorage.getItem('activeGoals');
    expect(JSON.parse(storedActiveGoalsAfterCompletion || '[]')).toHaveLength(0);
  });

  it('should handle multiple goals with proper state management', async () => {
    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return null;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    // Add multiple goals to user's goal list
    const userGoals = ['goal1', 'goal2', 'goal3'];
    act(() => {
      contextValues.setMyGoals(userGoals);
    });

    // Start multiple goals
    const activeGoals = [
      { mainGoalId: 'main1', goalId: 'goal1', startedAt: new Date().toISOString() },
      { mainGoalId: 'main1', goalId: 'goal2', startedAt: new Date().toISOString() }
    ];

    act(() => {
      contextValues.setActiveGoals(activeGoals);
    });

    await waitFor(() => {
      expect(contextValues.activeGoals).toHaveLength(2);
      expect(contextValues.myGoals).toEqual(userGoals);
    });

    // Complete one goal
    const finishedGoal = {
      mainGoalId: 'main1',
      goalId: 'goal1',
      finished: new Date().toISOString()
    };

    act(() => {
      contextValues.setFinishedGoals([finishedGoal]);
      contextValues.setActiveGoals([activeGoals[1]]); // Remove completed goal
      contextValues.setMyXP((prev: number) => prev + 100);
    });

    // Verify state after completion
    await waitFor(() => {
      expect(contextValues.finishedGoals).toHaveLength(1);
      expect(contextValues.activeGoals).toHaveLength(1);
      expect(contextValues.myXP).toBe(100);
    });

    // Wait for AsyncStorage operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify persistence
    const storedFinished = await AsyncStorage.getItem('finishedGoals');
    const storedActive = await AsyncStorage.getItem('activeGoals');
    const storedXP = await AsyncStorage.getItem('myXP');

    expect(JSON.parse(storedFinished || '[]')).toHaveLength(1);
    expect(JSON.parse(storedActive || '[]')).toHaveLength(1);
    expect(storedXP).toBe('100');
  });

  it('should handle goal progress tracking integration', async () => {
    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return <GoalDetailScreen />;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    // Start a goal with specific start date
    const startDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    const activeGoal = {
      mainGoalId: 'main1',
      goalId: 'goal1',
      startedAt: startDate.toISOString()
    };

    act(() => {
      contextValues.setActiveGoals([activeGoal]);
    });

    // Verify progress tracking can access the data
    expect(contextValues.activeGoals[0].startedAt).toBe(startDate.toISOString());
    
    // The progress calculation would be done by goalUtils
    // Here we're testing that the data flows correctly through the integration
    const goalInProgress = contextValues.activeGoals.find(
      (g: any) => g.mainGoalId === 'main1' && g.goalId === 'goal1'
    );
    expect(goalInProgress).toBeTruthy();
    expect(new Date(goalInProgress.startedAt)).toEqual(startDate);
  });
});