import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

import { NoopAdapter } from './noopAdapter';
import { AdapterStatus, WearableAdapter } from './types';

type WearableContextValue = {
  adapter: WearableAdapter;
  status: AdapterStatus;
  setAdapter: (adapter: WearableAdapter) => Promise<void>;
  refreshStatus: () => Promise<void>;
};

const WearableContext = createContext<WearableContextValue | null>(null);

type WearableProviderProps = {
  readonly children: React.ReactNode;
  readonly initialAdapter?: WearableAdapter;
};

export function WearableProvider({ children, initialAdapter }: WearableProviderProps) {
  const markSuccessfulSync = useCallback(() => {
    const syncTime = new Date().toISOString();
    setStatus(prev => ({ ...prev, lastSyncAt: syncTime }));
  }, []);

  const createTrackedAdapter = useCallback((base: WearableAdapter): WearableAdapter => {
    return {
      source: base.source,
      getStatus: () => base.getStatus(),
      connect: base.connect ? async () => { await base.connect?.(); } : undefined,
      disconnect: base.disconnect ? async () => { await base.disconnect?.(); } : undefined,
      getSleep: async range => {
        const result = await base.getSleep(range);
        markSuccessfulSync();
        return result;
      },
      getHRV: async range => {
        const result = await base.getHRV(range);
        markSuccessfulSync();
        return result;
      },
      getDailyActivity: async range => {
        const result = await base.getDailyActivity(range);
        markSuccessfulSync();
        return result;
      },
      getEnergySignal: async range => {
        const result = await base.getEnergySignal(range);
        markSuccessfulSync();
        return result;
      },
    };
  }, [markSuccessfulSync]);

  const [adapterState, setAdapterState] = useState<WearableAdapter>(() => createTrackedAdapter(initialAdapter ?? new NoopAdapter()));
  const [status, setStatus] = useState<AdapterStatus>(() => ({ state: 'disconnected', source: (initialAdapter ?? new NoopAdapter()).source }));

  const refreshStatus = useCallback(async () => {
    const s = await adapterState.getStatus();
    setStatus(prev => ({ ...s, lastSyncAt: prev.lastSyncAt }));
  }, [adapterState]);

  const setAdapter = async (next: WearableAdapter) => {
    const trackedAdapter = createTrackedAdapter(next);
    setAdapterState(trackedAdapter);
    const s = await next.getStatus();
    setStatus(prev => ({ ...s, lastSyncAt: prev.lastSyncAt }));
  };

  // load initial status once adapter exists
  React.useEffect(() => {
    refreshStatus().catch(() => setStatus({ state: 'error', message: 'Failed to load adapter status' }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapterState]);

  const value = useMemo(() => ({ adapter: adapterState, status, setAdapter, refreshStatus }), [adapterState, refreshStatus, status]);

  return <WearableContext.Provider value={value}>{children}</WearableContext.Provider>;
}

export function useWearable() {
  const ctx = useContext(WearableContext);
  if (!ctx) throw new Error('useWearable must be used inside WearableProvider');
  return ctx;
}
