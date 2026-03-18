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
  const [adapterState, setAdapterState] = useState<WearableAdapter>(() => initialAdapter ?? new NoopAdapter());
  const [status, setStatus] = useState<AdapterStatus>(() => ({ state: 'disconnected', source: (initialAdapter ?? new NoopAdapter()).source }));

  const refreshStatus = useCallback(async () => {
    const s = await adapterState.getStatus();
    setStatus(s);
  }, [adapterState]);

  const setAdapter = async (next: WearableAdapter) => {
    setAdapterState(next);
    const s = await next.getStatus();
    setStatus(s);
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
