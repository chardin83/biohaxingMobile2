import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { StorageProvider, useStorage } from '../app/context/StorageContext';
import { Plan } from '../app/domain/Plan';

// This is an integration test that uses real AsyncStorage and real context
describe('StorageContext Integration', () => {
  let contextValuesRef: { current: any };

  // Definiera TestComponent EN gång
  const TestComponent = () => {
    const ctx = useStorage();
    React.useEffect(() => {
      contextValuesRef.current = ctx;
    });
    return null;
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    contextValuesRef = { current: {} };
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('should persist and load plans from real AsyncStorage', async () => {
    const testPlan: Plan = {
      name: 'Test Health Plan',
      prefferedTime: 'morning',
      notify: false,
      supplements: [
        {
          supplement: {
            id: 'vitamin-d',
            name: 'Vitamin D',
            quantity: "1000",
            unit: 'IU',
          },
          startedAt: '2024-01-01T00:00:00Z',
          createdBy: 'test-user',
          planName: 'Test Health Plan',
          prefferedTime: 'morning',
          notify: false,
          reason: '',
        },
      ],
      reason: '',
    };

    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValuesRef.current.isInitialized).toBe(true);
    });

    act(() => {
      contextValuesRef.current.setPlans({
        supplements: [testPlan],
        training: [],
        nutrition: [],
        other: [],
      });
    });

    await waitFor(() => {
      expect(contextValuesRef.current.plans).toEqual({
        supplements: [testPlan],
        training: [],
        nutrition: [],
        other: [],
        reasonSummary: { text: '', createdAt: '' },
      });
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const storedPlans = await AsyncStorage.getItem('plans');
    expect(JSON.parse(storedPlans || '[]')).toEqual({
      supplements: [testPlan],
      training: [],
      nutrition: [],
      other: [],
      reasonSummary: { text: '', createdAt: '' },
    });
  });

  it('should persist and load goals from real AsyncStorage', async () => {
    const testAreas = ['area1', 'area2'];
    const planEntry = {
      mainGoalId: 'main1',
      tipId: 'tip1',
      startedAt: new Date().toISOString(),
      planCategory: 'training' as const,
    };

    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValuesRef.current.isInitialized).toBe(true);
    });

    act(() => {
      contextValuesRef.current.setMyAreas(testAreas);
      contextValuesRef.current.setPlans({ supplements: [], training: [planEntry], nutrition: [], other: [] });
    });

    await waitFor(() => {
      expect(contextValuesRef.current.myAreas).toEqual(testAreas);
      expect(contextValuesRef.current.plans.training).toEqual([planEntry]);
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const storedGoals = await AsyncStorage.getItem('myAreas');
    const storedPlans = await AsyncStorage.getItem('plans');

    expect(JSON.parse(storedGoals || '[]')).toEqual(testAreas);
    expect(JSON.parse(storedPlans || '[]')).toEqual({
      supplements: [],
      training: [planEntry],
      nutrition: [],
      other: [],
      reasonSummary: { text: '', createdAt: '' },
    });
  });

  it('should handle XP and level progression with real persistence', async () => {
    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValuesRef.current.isInitialized).toBe(true);
    });

    act(() => {
      contextValuesRef.current.setMyXP(150);
      contextValuesRef.current.setMyLevel(2);
    });

    await waitFor(() => {
      expect(contextValuesRef.current.myXP).toBe(150);
      expect(contextValuesRef.current.myLevel).toBe(2);
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const storedXP = await AsyncStorage.getItem('myXP');
    const storedLevel = await AsyncStorage.getItem('myLevel');

    expect(storedXP).toBe('150');
    expect(storedLevel).toBe('2');
  });

  it('should load existing data on initialization', async () => {
    const existingPlans = {
      supplements: [{ id: 'existing-plan', name: 'Existing Plan', supplements: [], prefferedTime: 'evening' }],
      training: [],
      nutrition: [],
      other: [],
      reasonSummary: { text: '', createdAt: '' },
    };
    const existingAreas = ['existing-area'];

    await AsyncStorage.setItem('plans', JSON.stringify(existingPlans));
    await AsyncStorage.setItem('myAreas', JSON.stringify(existingAreas));
    await AsyncStorage.setItem('myXP', '50');

    render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    // Wait for initialization and data loading
    await waitFor(() => {
      expect(contextValuesRef.current.isInitialized).toBe(true);
      expect(contextValuesRef.current.plans).toEqual(existingPlans);
      expect(contextValuesRef.current.myAreas).toEqual(existingAreas);
      expect(contextValuesRef.current.myXP).toBe(50);
    });
  });

  it('should handle nutrition summaries persistence', async () => {
    const nutritionSummary = {
      '2024-01-01': {
        date: '2024-01-01',
        meals: [],
        totals: { protein: 50, calories: 1500, carbohydrates: 200, fat: 50, fiber: 25 },
        goalsMet: { protein: true, calories: true, carbohydrates: true, fat: true, fiber: true },
      },
    };

     render(
      <StorageProvider>
        <TestComponent />
      </StorageProvider>
    );

    act(() => {
      contextValuesRef.current.setDailyNutritionSummaries(nutritionSummary);
    });

    await waitFor(() => {
      expect(contextValuesRef.current.dailyNutritionSummaries).toEqual(nutritionSummary);
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const storedSummaries = await AsyncStorage.getItem('dailyNutritionSummary');
    expect(JSON.parse(storedSummaries || '{}')).toEqual(nutritionSummary);
  });
});
