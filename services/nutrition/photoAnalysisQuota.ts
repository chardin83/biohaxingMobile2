import AsyncStorage from '@react-native-async-storage/async-storage';

import { FREE_PHOTO_ANALYSIS_LIMIT } from '@/constants/Premium';

const STORAGE_KEY = 'freePhotoAnalysesUsed';
const listeners = new Set<() => void>();
let pendingUpdate: Promise<unknown> = Promise.resolve();

export async function getFreePhotoAnalysesRemaining(): Promise<number> {
  const value = Number(await AsyncStorage.getItem(STORAGE_KEY));
  const used = Number.isInteger(value) ? Math.max(0, value) : 0;
  return Math.max(0, FREE_PHOTO_ANALYSIS_LIMIT - used);
}

export function subscribePhotoAnalysisQuota(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function updateQuota(refund: boolean): Promise<boolean> {
  const update = pendingUpdate.then(async () => {
    const remaining = await getFreePhotoAnalysesRemaining();
    if (!refund && remaining === 0) return false;
    const used = Math.max(0, FREE_PHOTO_ANALYSIS_LIMIT - remaining + (refund ? -1 : 1));
    await AsyncStorage.setItem(STORAGE_KEY, String(used));
    listeners.forEach(listener => listener());
    return true;
  });
  pendingUpdate = update.catch(() => undefined);
  return update;
}

export const reserveFreePhotoAnalysis = () => updateQuota(false);
export const refundFreePhotoAnalysis = () => updateQuota(true);
