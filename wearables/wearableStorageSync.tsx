import React from 'react';

import { useWearableStorageSync } from '@/hooks/useWearableStorageSync';
import { shouldSyncWearableData } from '@/wearables/syncMetricsToStorage';
import { useWearable } from '@/wearables/wearableProvider';

export function WearableStorageSync() {
  const { status } = useWearable();
  const { sync } = useWearableStorageSync();

  React.useEffect(() => {
    if (!shouldSyncWearableData(status.lastSyncAt)) {
      return;
    }

    sync().catch(error => console.warn('[WearableStorageSync] Sync failed; using saved data', error));
  }, [status.lastSyncAt, sync]);

  return null;
}
