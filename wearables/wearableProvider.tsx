import React, { createContext, useContext, useMemo, useState } from "react";

import { MockAdapter } from "./mockAdapter";
import { AdapterStatus,WearableAdapter } from "./types";

type WearableContextValue = {
  adapter: WearableAdapter;
  status: AdapterStatus;
  setAdapter: (adapter: WearableAdapter) => Promise<void>;
  refreshStatus: () => Promise<void>;
};

const WearableContext = createContext<WearableContextValue | null>(null);

export function WearableProvider({ children }: { children: React.ReactNode }) {
  const [adapter, setAdapterState] = useState<WearableAdapter>(() => new MockAdapter());
  const [status, setStatus] = useState<AdapterStatus>({ state: "disconnected" });

  const refreshStatus = async () => {
    const s = await adapter.getStatus();
    setStatus(s);
  };

  const setAdapter = async (next: WearableAdapter) => {
    setAdapterState(next);
    const s = await next.getStatus();
    setStatus(s);
  };

  // load initial status once adapter exists
  React.useEffect(() => {
    refreshStatus().catch(() => setStatus({ state: "error", message: "Failed to load adapter status" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adapter]);

  const value = useMemo(
    () => ({ adapter, status, setAdapter, refreshStatus }),
    [adapter, status]
  );

  return <WearableContext.Provider value={value}>{children}</WearableContext.Provider>;
}

export function useWearable() {
  const ctx = useContext(WearableContext);
  if (!ctx) throw new Error("useWearable must be used inside WearableProvider");
  return ctx;
}
