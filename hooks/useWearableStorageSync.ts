import { useCallback } from 'react';

import { useStorage } from '@/app/context/StorageContext';
import { syncWearableMetricsToStorage } from '@/wearables/syncMetricsToStorage';
import { useWearable } from '@/wearables/wearableProvider';

export const useWearableStorageSync = () => {
  const { adapter, isSyncing, beginSync, finishSync, markSynced } = useWearable();

  const { upsertMetricEntries, upsertTrainingEntries, isReadyForHealthSync } = useStorage();

  const sync = useCallback(async () => {
    if (!isReadyForHealthSync || !beginSync()) return;

    let syncError: string | undefined;
    try {
      if (adapter.source === 'none') return;
      await syncWearableMetricsToStorage(adapter, upsertMetricEntries, 30, upsertTrainingEntries);

      markSynced();
    } catch (error) {
      syncError = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      finishSync(syncError);
    }
  }, [adapter, isReadyForHealthSync, beginSync, finishSync, markSynced, upsertMetricEntries, upsertTrainingEntries]);

  return {
    sync,
    isSyncing,
  };
};
