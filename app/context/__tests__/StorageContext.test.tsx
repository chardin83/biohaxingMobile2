import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { StorageProvider, useStorage } from '../StorageContext';

// Helper component to expose context values for testing
const TestComponent = ({ callback }: { callback: (ctx: ReturnType<typeof useStorage>) => void }) => {
  const ctx = useStorage();
  React.useEffect(() => {
    callback(ctx);
    // eslint-disable-next-line
  }, [ctx]);
  return null;
};

describe('StorageContext', () => {
  it('provides default values and allows updating plans', async () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent callback={(ctx) => { contextValues = ctx; }} />
      </StorageProvider>
    );
    expect(contextValues.plans).toEqual([]);
    act(() => {
      contextValues.setPlans([{ id: 'plan1', name: 'Plan 1' }]);
    });
    // Wait for the state update
    await waitFor(() => {
      expect(contextValues.plans).toEqual([{ id: 'plan1', name: 'Plan 1' }]);
    });
  });

  it('can set and get myGoals', async () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent callback={(ctx) => { contextValues = ctx; }} />
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

  it('can set and get activeGoals', () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent callback={(ctx) => { contextValues = ctx; }} />
      </StorageProvider>
    );
    const activeGoal = { mainGoalId: 'main1', goalId: 'goal1', startedAt: new Date().toISOString() };
    act(() => {
      contextValues.setActiveGoals([activeGoal]);
    });
    expect(contextValues.activeGoals).toEqual([activeGoal]);
  });

  it('can set and get finishedGoals', () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent callback={(ctx) => { contextValues = ctx; }} />
      </StorageProvider>
    );
    const finishedGoal = { mainGoalId: 'main1', goalId: 'goal1', finished: new Date().toISOString() };
    act(() => {
      contextValues.setFinishedGoals([finishedGoal]);
    });
    expect(contextValues.finishedGoals).toEqual([finishedGoal]);
  });

  it('can set and get XP and level', () => {
    let contextValues: any = {};
    render(
      <StorageProvider>
        <TestComponent callback={(ctx) => { contextValues = ctx; }} />
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
