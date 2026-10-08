import { act, render, waitFor } from '@testing-library/react-native';
import React from 'react';

import * as habitResults from '@/services/targetProgress/habitResultStorage';
import { useWearable } from '@/wearables/wearableProvider';

import { StorageProvider, useStorage } from '../StorageContext';

jest.mock('@/wearables/wearableProvider', () => ({
  useWearable: jest.fn(() => ({ isSyncing: false, hasCompletedInitialSync: true })),
}));

// Helper component to expose context values for testing
const TestComponent = ({ callback }: { callback: (ctx: ReturnType<typeof useStorage>) => void }) => {
  const ctx = useStorage();
  React.useEffect(() => {
    callback(ctx);
  }, [callback, ctx]);
  return null;
};

describe('StorageContext', () => {
  it('processes automatic habits only after the initial sync and pauses during later syncs', async () => {
    const wearable = { isSyncing: false, hasCompletedInitialSync: false };
    jest.mocked(useWearable).mockImplementation(() => wearable as unknown as ReturnType<typeof useWearable>);
    const assessment = jest.spyOn(habitResults, 'storeAutomaticSleepResults');
    let contextValues: ReturnType<typeof useStorage> | undefined;
    const capture = (context: ReturnType<typeof useStorage>) => { contextValues = context; };
    const content = () => <StorageProvider><TestComponent callback={capture} /></StorageProvider>;
    try {
      const { rerender } = render(content());
      await waitFor(() => expect(contextValues?.isReadyForHealthSync).toBe(true));
      expect(assessment).not.toHaveBeenCalled();
      expect(contextValues?.automaticHabitSummary.isReady).toBe(false);

      wearable.isSyncing = true;
      rerender(content());
      expect(assessment).not.toHaveBeenCalled();

      wearable.isSyncing = false;
      wearable.hasCompletedInitialSync = true;
      rerender(content());
      await waitFor(() => expect(assessment).toHaveBeenCalled());
      expect(contextValues?.automaticHabitSummary.isReady).toBe(true);
      assessment.mockClear();

      wearable.isSyncing = true;
      rerender(content());
      expect(assessment).not.toHaveBeenCalled();
      expect(contextValues?.automaticHabitSummary.isReady).toBe(false);
      wearable.isSyncing = false;
      rerender(content());
      await waitFor(() => expect(assessment).toHaveBeenCalled());
    } finally {
      assessment.mockRestore();
      jest.mocked(useWearable).mockImplementation(() => ({ isSyncing: false, hasCompletedInitialSync: true }) as unknown as ReturnType<typeof useWearable>);
    }
  });

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

    // Vänta på initialisering
    await waitFor(() => {
      expect(contextValues.plans).toBeDefined();
    });

    // Uppdatera plans
    act(() => {
      contextValues.setPlans({
        supplements: [{ name: 'Plan 1', supplements: [], prefferedTime: '08:00', notify: false }],
        training: [],
        nutrition: [],
        other: [],
        reasonSummary: { text: '', createdAt: '' },
      });
    });

    // Vänta på uppdateringen
    await waitFor(() => {
      expect(contextValues.plans.supplements).toHaveLength(1);
    });
  });

  it('can set and get myAreas', async () => {
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

    // Vänta på initialisering
    await waitFor(() => {
      expect(contextValues.myAreas).toBeDefined();
    });

    // Uppdatera myAreas
    act(() => {
      contextValues.setMyAreas(['area1', 'area2']);
    });

    // Vänta på uppdateringen
    await waitFor(() => {
      expect(contextValues.myAreas).toEqual(['area1', 'area2']);
    });
  });

  it('can set and get XP and level', async () => {
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

    // Vänta på initialisering
    await waitFor(() => {
      expect(contextValues.myXP).toBeDefined();
    });

    // Uppdatera XP och level
    act(() => {
      contextValues.setMyXP(100);
      contextValues.setMyLevel(2);
    });

    // Vänta på uppdateringen
    await waitFor(() => {
      expect(contextValues.myXP).toBe(100);
      expect(contextValues.myLevel).toBe(2);
    });
  });

  it('throws error if useStorage is used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => useStorage()).toThrow();
    spy.mockRestore();
  });
});
