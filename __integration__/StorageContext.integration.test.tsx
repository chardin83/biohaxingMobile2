import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { StorageProvider, useStorage } from '../app/context/StorageContext';
import { Plan } from '../app/domain/Plan';

// This is an integration test that uses real AsyncStorage and real context
describe('StorageContext Integration', () => {
  beforeEach(async () => {
    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
  });

  afterEach(async () => {
    // Clean up after each test
    await AsyncStorage.clear();
  });

  it('should persist and load plans from real AsyncStorage', async () => {
    let contextValues: any = {};

    const TestComponent = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return null;
    };

    const testPlan: Plan = {
      name: 'Test Health Plan',
      supplements: [
        {
          id: 'vitamin-d',
          name: 'Vitamin D',
          quantity: 1000,
          unit: 'IU',
        },
      ],
      prefferedTime: 'morning',
      notify: false,
    };

    // Render the provider
    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    // Wait for initialization
    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    // Add a plan
    act(() => {
      contextValues.setPlans({ supplements: [testPlan], training: [], nutrition: [], other: [] });
    });

    // Wait for the state to be updated
    await waitFor(() => {
      expect(contextValues.plans).toEqual({ supplements: [testPlan], training: [], nutrition: [], other: [] });
    });

    // Wait a bit more for AsyncStorage operation to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify the plan was persisted to AsyncStorage
    const storedPlans = await AsyncStorage.getItem('plans');
    expect(JSON.parse(storedPlans || '[]')).toEqual({
      supplements: [testPlan],
      training: [],
      nutrition: [],
      other: [],
    });
  });

  it('should persist and load goals from real AsyncStorage', async () => {
    let contextValues: any = {};

    const TestComponent = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return null;
    };

    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    const testGoals = ['goal1', 'goal2'];
    const planEntry = {
      mainGoalId: 'main1',
      tipId: 'goal1',
      startedAt: new Date().toISOString(),
      planCategory: 'training' as const,
    };

    // Set goals and categorized plans
    act(() => {
      contextValues.setMyGoals(testGoals);
      contextValues.setPlans({ supplements: [], training: [planEntry], nutrition: [], other: [] });
    });

    // Wait for state updates
    await waitFor(() => {
      expect(contextValues.myGoals).toEqual(testGoals);
      expect(contextValues.plans.training).toEqual([planEntry]);
    });

    // Wait for AsyncStorage operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify persistence
    const storedGoals = await AsyncStorage.getItem('myGoals');
    const storedPlans = await AsyncStorage.getItem('plans');

    expect(JSON.parse(storedGoals || '[]')).toEqual(testGoals);
    expect(JSON.parse(storedPlans || '[]')).toEqual({
      supplements: [],
      training: [planEntry],
      nutrition: [],
      other: [],
    });
  });

  it('should handle XP and level progression with real persistence', async () => {
    let contextValues: any = {};

    const TestComponent = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return null;
    };

    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    // Set XP and level
    act(() => {
      contextValues.setMyXP(150);
      contextValues.setMyLevel(2);
    });

    await waitFor(() => {
      expect(contextValues.myXP).toBe(150);
      expect(contextValues.myLevel).toBe(2);
    });

    // Wait for AsyncStorage operations
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify persistence
    const storedXP = await AsyncStorage.getItem('myXP');
    const storedLevel = await AsyncStorage.getItem('myLevel');

    expect(storedXP).toBe('150');
    expect(storedLevel).toBe('2');
  });

  it('should load existing data on initialization', async () => {
    // Pre-populate AsyncStorage
    const existingPlans = {
      supplements: [{ id: 'existing-plan', name: 'Existing Plan', supplements: [], prefferedTime: 'evening' }],
      training: [],
      nutrition: [],
      other: [],
    };
    const existingGoals = ['existing-goal'];

    await AsyncStorage.setItem('plans', JSON.stringify(existingPlans));
    await AsyncStorage.setItem('myGoals', JSON.stringify(existingGoals));
    await AsyncStorage.setItem('myXP', '50');

    let contextValues: any = {};

    const TestComponent = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return null;
    };

    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    // Wait for initialization and data loading
    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
      expect(contextValues.plans).toEqual(existingPlans);
      expect(contextValues.myGoals).toEqual(existingGoals);
      expect(contextValues.myXP).toBe(50);
    });
  });

  it('should handle nutrition summaries persistence', async () => {
    let contextValues: any = {};

    const TestComponent = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return null;
    };

    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    const nutritionSummary = {
      '2024-01-01': {
        date: '2024-01-01',
        meals: [],
        totals: { protein: 50, calories: 1500, carbohydrates: 200, fat: 50, fiber: 25 },
        goalsMet: { protein: true, calories: true, carbohydrates: true, fat: true, fiber: true },
      },
    };

    act(() => {
      contextValues.setDailyNutritionSummaries(nutritionSummary);
    });

    await waitFor(() => {
      expect(contextValues.dailyNutritionSummaries).toEqual(nutritionSummary);
    });

    // Wait for AsyncStorage operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify persistence
    const storedSummaries = await AsyncStorage.getItem('dailyNutritionSummary');
    expect(JSON.parse(storedSummaries || '{}')).toEqual(nutritionSummary);
  });
});
