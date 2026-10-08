import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { NoopAdapter } from './noopAdapter';
import { AdapterStatus, WearableAdapter } from './types';
import { createWearableAdapter } from './wearableAdapter';

type WearableContextValue = {
  adapter: WearableAdapter;
  status: AdapterStatus;
  isSyncing: boolean;
  hasCompletedInitialSync: boolean;
  beginSync: () => boolean;
  finishSync: (errorMessage?: string) => void;
  syncError: string | null;
  setAdapter: (adapter: WearableAdapter) => Promise<void>;
  refreshStatus: () => Promise<void>;
  markSynced: () => void;
};

const WearableContext = createContext<WearableContextValue | null>(null);

type WearableProviderProps = {
  readonly children: React.ReactNode;
  readonly initialAdapter?: WearableAdapter;
};

export function WearableProvider({ children, initialAdapter }: WearableProviderProps) {
  const [adapterState, setAdapterState] = useState<WearableAdapter>(() => initialAdapter ?? createWearableAdapter() ?? new NoopAdapter());
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);
  const [hasCompletedInitialSync, setHasCompletedInitialSync] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const beginSync = useCallback(() => {
    if (syncInProgress.current) return false;
    syncInProgress.current = true;
    setSyncError(null);
    setIsSyncing(true);
    return true;
  }, []);
  const finishSync = useCallback((errorMessage?: string) => {
    syncInProgress.current = false;
    setIsSyncing(false);
    setSyncError(errorMessage ?? null);
    // Also release cached-data processing after a failed or skipped sync.
    setHasCompletedInitialSync(true);
  }, []);
  const [status, setStatus] = useState<AdapterStatus>(() => ({
    state: 'disconnected',
    source: adapterState.source,
  }));

  const refreshStatus = useCallback(async () => {
    const nextStatus = await adapterState.getStatus();

    setStatus(prev => ({
      ...nextStatus,
      lastSyncAt: prev.lastSyncAt,
    }));
  }, [adapterState]);

  const setAdapter = useCallback(async (next: WearableAdapter) => {
    setHasCompletedInitialSync(false);
    setAdapterState(next);

    const nextStatus = await next.getStatus();

    setStatus(nextStatus);
  }, []);

  const markSynced = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      lastSyncAt: new Date().toISOString(),
    }));
  }, []);

  React.useEffect(() => {
    refreshStatus().catch(error => {
      console.warn('[WearableProvider] refreshStatus failed', error);

      setStatus(prev => ({
        ...prev,
        state: 'error',
        message: 'Failed to load adapter status',
      }));
    });
  }, [refreshStatus]);

  const value = useMemo(
    () => ({
      adapter: adapterState,
      status,
      isSyncing,
      hasCompletedInitialSync,
      beginSync,
      finishSync,
      syncError,
      setAdapter,
      refreshStatus,
      markSynced,
    }),
    [adapterState, status, isSyncing, hasCompletedInitialSync, beginSync, finishSync, syncError, setAdapter, refreshStatus, markSynced]
  );

  return <WearableContext.Provider value={value}>{children}</WearableContext.Provider>;
}

export function useWearable() {
  const context = useContext(WearableContext);

  if (!context) {
    throw new Error('useWearable must be used inside WearableProvider');
  }

  return context;
}
