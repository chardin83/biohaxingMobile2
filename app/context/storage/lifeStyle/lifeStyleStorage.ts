import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStorageSize } from '../shared/storageSize';
import { getDailyRange, getTrackingKeys, removeDailyValue, saveDailyValue } from '../shared/trackingStorage';
import type { LifeStyleDay, LifeStyleLog } from './lifeStyleTypes';

const NAMESPACE = 'lifeStyleLog';

export async function getLifeStyleLog(): Promise<LifeStyleLog> {
  return getDailyRange<LifeStyleDay>(NAMESPACE, await getTrackingKeys(NAMESPACE));
}

export async function saveLifeStyleDay(date: string, day: LifeStyleDay): Promise<void> {
  if (Object.keys(day).length) await saveDailyValue(NAMESPACE, date, day);
  else await removeDailyValue(NAMESPACE, date);
}

export async function clearLifeStyleStorage(): Promise<void> {
  const dates = await getTrackingKeys(NAMESPACE);
  if (dates.length) await AsyncStorage.multiRemove(dates.map(date => `${NAMESPACE}:${date}`));
}

export const getLifeStyleStorageSize = () => getStorageSize([NAMESPACE]);
