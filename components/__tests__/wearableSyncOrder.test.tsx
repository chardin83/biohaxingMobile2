import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useStorage } from '@/app/context/StorageContext';
import { useWearableStorageSync } from '@/hooks/useWearableStorageSync';
import { syncWearableMetricsToStorage } from '@/wearables/syncMetricsToStorage';
import type { WearableAdapter } from '@/wearables/types';
import { useWearable, WearableProvider } from '@/wearables/wearableProvider';
import { WearableStorageSync } from '@/wearables/WearableStorageSync';

jest.mock('@/app/context/StorageContext', () => ({ useStorage: jest.fn() }));
jest.mock('@/wearables/syncMetricsToStorage', () => ({
  ...jest.requireActual('@/wearables/syncMetricsToStorage'),
  syncWearableMetricsToStorage: jest.fn(),
}));
jest.mock('@/wearables/wearableAdapter', () => ({ createWearableAdapter: jest.fn() }));

const adapter = { source: 'mock', getStatus: async () => ({ state: 'connected', source: 'mock' }) } as WearableAdapter;
const wrapper = ({ children }: { children: React.ReactNode }) => <WearableProvider initialAdapter={adapter}>{children}</WearableProvider>;
const upsertMetricEntries = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useStorage).mockReturnValue({ isReadyForHealthSync: true, upsertMetricEntries } as unknown as ReturnType<typeof useStorage>);
});

it('waits for storage and profile, then keeps the habit gate closed until ingestion finishes', async () => {
  jest.mocked(useStorage).mockReturnValue({ isReadyForHealthSync: false, upsertMetricEntries } as unknown as ReturnType<typeof useStorage>);
  let finish!: () => void;
  jest.mocked(syncWearableMetricsToStorage).mockImplementation(async (_adapter, ingest) => {
    await new Promise<void>(resolve => { finish = resolve; });
    ingest([]);
    return { entryCount: 0, bloodPressureReadingCount: 0 };
  });
  const { result, rerender } = renderHook(() => ({ ...useWearableStorageSync(), ...useWearable() }), { wrapper });
  await act(async () => { await result.current.sync(); });
  expect(syncWearableMetricsToStorage).not.toHaveBeenCalled();
  expect(result.current.hasCompletedInitialSync).toBe(false);

  jest.mocked(useStorage).mockReturnValue({ isReadyForHealthSync: true, upsertMetricEntries } as unknown as ReturnType<typeof useStorage>);
  rerender({});
  let syncing!: Promise<void>;
  act(() => { syncing = result.current.sync(); });
  expect(result.current.isSyncing).toBe(true);
  expect(result.current.hasCompletedInitialSync).toBe(false);
  await act(async () => { await result.current.sync(); });
  expect(syncWearableMetricsToStorage).toHaveBeenCalledTimes(1);
  expect(upsertMetricEntries).not.toHaveBeenCalled();

  await act(async () => { finish(); await syncing; });
  expect(upsertMetricEntries).toHaveBeenCalledTimes(1);
  expect(result.current.isSyncing).toBe(false);
  expect(result.current.hasCompletedInitialSync).toBe(true);
  expect(result.current.status.lastSyncAt).toBeDefined();
});

it('releases saved-data processing on failure without marking a successful sync', async () => {
  jest.mocked(syncWearableMetricsToStorage).mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => ({ ...useWearableStorageSync(), ...useWearable() }), { wrapper });
  await act(async () => { await expect(result.current.sync()).rejects.toThrow('offline'); });
  expect(result.current.isSyncing).toBe(false);
  expect(result.current.hasCompletedInitialSync).toBe(true);
  expect(result.current.status.lastSyncAt).toBeUndefined();
  expect(result.current.syncError).toBe('offline');
});

it('allows saved-data processing when no health source is configured', async () => {
  const none = { ...adapter, source: 'none' } as WearableAdapter;
  const { result } = renderHook(() => ({ ...useWearableStorageSync(), ...useWearable() }), {
    wrapper: ({ children }) => <WearableProvider initialAdapter={none}>{children}</WearableProvider>,
  });
  await waitFor(() => expect(result.current.adapter.source).toBe('none'));
  await act(async () => { await result.current.sync(); });
  expect(syncWearableMetricsToStorage).not.toHaveBeenCalled();
  expect(result.current.hasCompletedInitialSync).toBe(true);
  expect(result.current.isSyncing).toBe(false);
});

it('does not automatically loop on a failed startup sync', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  jest.mocked(syncWearableMetricsToStorage).mockRejectedValue(new Error('offline'));
  try {
    const { result } = renderHook(() => useWearable(), {
      wrapper: ({ children }) => (
        <WearableProvider initialAdapter={adapter}>
          <WearableStorageSync />
          {children}
        </WearableProvider>
      ),
    });
    await waitFor(() => expect(result.current.hasCompletedInitialSync).toBe(true));
    expect(syncWearableMetricsToStorage).toHaveBeenCalledTimes(1);
    expect(result.current.isSyncing).toBe(false);
  } finally {
    warning.mockRestore();
  }
});
