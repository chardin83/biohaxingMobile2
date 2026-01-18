import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import { StorageProvider, useStorage } from '../StorageContext';

// Helper component to expose context values for testing
const TestComponent = ({ callback }: { callback: (ctx: ReturnType<typeof useStorage>) => void }) => {
  const ctx = useStorage();
  React.useEffect(() => {
    callback(ctx);
  }, [ctx]);
  return null;
};

describe('StorageContext', () => {
  it('provides default values and allows updating plans', async () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent
          callback={ctx => {
            contextValues = ctx;
          }}
        />
      </StorageProvider>
    );
    expect(contextValues.plans).toEqual({ supplements: [], training: [], nutrition: [], other: [] });
    act(() => {
      contextValues.setPlans({
        supplements: [{ name: 'Plan 1', supplements: [], prefferedTime: '08:00', notify: false }],
        training: [],
        nutrition: [],
        other: [],
      });
    });
    // Wait for the state update
    await waitFor(() => {
      expect(contextValues.plans.supplements).toHaveLength(1);
    });
  });

  it('can set and get myGoals', async () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent
          callback={ctx => {
            contextValues = ctx;
          }}
        />
      </StorageProvider>
    );
    act(() => {
      contextValues.setMyGoals(['goal1', 'goal2']);
    });
    // Wait for the state update
    await waitFor(() => {
      expect(contextValues.myGoals).toEqual(['goal1', 'goal2']);
    });
  });

  it('derives activeGoals from training and nutrition plans', () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent
          callback={ctx => {
            contextValues = ctx;
          }}
        />
      </StorageProvider>
    );
    const entry = {
      mainGoalId: 'main1',
      tipId: 'tip1',
      startedAt: new Date().toISOString(),
      planCategory: 'training' as const,
    };
    act(() => {
      contextValues.setPlans({ supplements: [], training: [entry], nutrition: [], other: [] });
    });
    expect(contextValues.activeGoals).toEqual([entry]);
  });

  it('can set and get XP and level', () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent
          callback={ctx => {
            contextValues = ctx;
          }}
        />
      </StorageProvider>
    );
    act(() => {
      contextValues.setMyXP(100);
      contextValues.setMyLevel(2);
    });
    expect(contextValues.myXP).toBe(100);
    expect(contextValues.myLevel).toBe(2);
  });

  it('throws error if useStorage is used outside provider', () => {
    // Suppress error output for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => useStorage()).toThrow();
    spy.mockRestore();
  });
});
