import { useCallback } from 'react';

import { useStorage } from '@/app/context/StorageContext';
import { syncWearableMetricsToStorage } from '@/wearables/syncMetricsToStorage';
import { useWearable } from '@/wearables/wearableProvider';

export const useWearableStorageSync = () => {
  const { adapter, isSyncing, setIsSyncing, markSynced } = useWearable();

  const { upsertMetricEntries } = useStorage();

  const sync = useCallback(async () => {
    if (adapter.source === 'none' || isSyncing) {
      return;
    }

    setIsSyncing(true);

    try {
      await syncWearableMetricsToStorage(adapter, upsertMetricEntries);

      markSynced();
    } finally {
      setIsSyncing(false);
    }
  }, [adapter, isSyncing, setIsSyncing, markSynced, upsertMetricEntries]);

  return {
    sync,
    isSyncing,
  };
};
