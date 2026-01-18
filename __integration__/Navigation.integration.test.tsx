import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';

import IndexRedirector from '../app/(tabs)/index';
import { StorageProvider, useStorage } from '../app/context/StorageContext';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: mockReplace,
    push: jest.fn(),
    back: jest.fn()
  })),
}));

// Mock safe area context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(() => ({ bottom: 0, top: 0 })),
}));

// Mock Colors
jest.mock('@/constants/Colors', () => ({
  Colors: {
    dark: {
      background: '#000000',
      primary: '#ff6b6b'
    }
  }
}));

describe('Navigation Integration', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    mockReplace.mockClear();
  });

  afterEach(async () => {
    await AsyncStorage.clear();
  });

  it('should redirect to onboarding when user has not completed onboarding', async () => {
    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return <IndexRedirector />;
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

    // Should redirect to first onboarding step
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/onboardingsupplements');
    });
  });

  it('should redirect to dashboard when user has completed onboarding', async () => {
    // Pre-populate AsyncStorage with completed onboarding
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');

    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return <IndexRedirector />;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    // Wait for context initialization and data loading
    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
      expect(contextValues.hasCompletedOnboarding).toBe(true);
    });

    // Should redirect to dashboard
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle onboarding step progression correctly', async () => {
    // Pre-populate with onboarding step 1
    await AsyncStorage.setItem('onBoardingStep', '1');
    await AsyncStorage.setItem('hasCompletedOnboarding', 'false');

    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return <IndexRedirector />;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
      expect(contextValues.onboardingStep).toBe(1);
      expect(contextValues.hasCompletedOnboarding).toBe(false);
    });

    // Should redirect to goals onboarding step
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/onboardinggoals');
    });
  });

  it('should show loading state while context is initializing', async () => {
    const { UNSAFE_getByType } = render(
      <StorageProvider>
        <IndexRedirector />
      </StorageProvider>
    );

    // Should show ActivityIndicator initially (before context initialization)
    expect(() => UNSAFE_getByType('ActivityIndicator')).not.toThrow();
  });

  it('should handle complete onboarding flow integration', async () => {
    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return <IndexRedirector />;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
    });

    // Start at onboarding step 0
    expect(contextValues.onboardingStep).toBe(0);
    expect(contextValues.hasCompletedOnboarding).toBe(false);

    // Should redirect to supplements onboarding
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/onboardingsupplements');
    });

    // Simulate progressing through onboarding
    act(() => {
      contextValues.setOnboardingStep(1);
    });

    expect(contextValues.onboardingStep).toBe(1);
    
    // Verify persistence
    await waitFor(async () => {
      const storedStep = await AsyncStorage.getItem('onBoardingStep');
      expect(storedStep).toBe('1');
    });

    // Complete onboarding
    act(() => {
      contextValues.setHasCompletedOnboarding(true);
    });

    expect(contextValues.hasCompletedOnboarding).toBe(true);

    // Verify completion persistence
    await waitFor(async () => {
      const completedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
      expect(completedOnboarding).toBe('true');
    });
  });

  it('should handle navigation state restoration from AsyncStorage', async () => {
    // Setup complex initial state
    const initialData = {
      plans: {
        supplements: [{ name: 'Morning Plan', supplements: [], prefferedTime: 'morning', notify: false }],
        training: [{ mainGoalId: 'main1', tipId: 'goal1', startedAt: new Date().toISOString(), planCategory: 'training' as const }],
        nutrition: [],
      },
      myGoals: ['goal1', 'goal2'],
      hasCompletedOnboarding: true,
      onboardingStep: 2,
      myXP: 250,
      myLevel: 3
    };

    await AsyncStorage.setItem('plans', JSON.stringify(initialData.plans));
    await AsyncStorage.setItem('myGoals', JSON.stringify(initialData.myGoals));
    await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
    await AsyncStorage.setItem('onBoardingStep', '2');
    await AsyncStorage.setItem('myXP', '250');
    await AsyncStorage.setItem('myLevel', '3');

    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return <IndexRedirector />;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    // Wait for full data restoration
    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
      expect(contextValues.plans).toEqual(initialData.plans);
      expect(contextValues.myGoals).toEqual(initialData.myGoals);
      expect(contextValues.hasCompletedOnboarding).toBe(true);
      expect(contextValues.onboardingStep).toBe(2);
      expect(contextValues.myXP).toBe(250);
      expect(contextValues.myLevel).toBe(3);
    });

    // Should redirect to dashboard since onboarding is completed
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should handle navigation with error states gracefully', async () => {
    // Mock AsyncStorage error
    const originalGetItem = AsyncStorage.getItem;
    AsyncStorage.getItem = jest.fn().mockRejectedValue(new Error('Storage error'));

    let contextValues: any = {};
    
    const TestWrapper = () => {
      const ctx = useStorage();
      React.useEffect(() => {
        contextValues = ctx;
      });
      return <IndexRedirector />;
    };

    render(
      <StorageProvider>
        <TestWrapper />
      </StorageProvider>
    );

    // Even with storage errors, context should initialize with defaults
    await waitFor(() => {
      expect(contextValues.isInitialized).toBe(true);
      expect(contextValues.hasCompletedOnboarding).toBe(false);
      expect(contextValues.onboardingStep).toBe(0);
    });

    // Should still redirect to onboarding with default values
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(onboarding)/onboardingsupplements');
    });

    // Restore original AsyncStorage
    AsyncStorage.getItem = originalGetItem;
  });
});