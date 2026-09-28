import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Supplement } from '@/app/domain/Supplement';
import type { SupplementTime } from '@/app/domain/SupplementTime';

import { getStorageSize } from '../shared/storageSize';

const KEYS = {
  TAKEN_DATES: 'takenDates',
  CUSTOM_SUPPLEMENTS: 'customSupplements',
} as const;

export type SupplementStorageData = {
  takenDates: Record<string, SupplementTime[]>;
  customSupplements: Supplement[];
};

export const getSupplementStorage = async (): Promise<SupplementStorageData> => {
  const [takenDates, customSupplements] = await Promise.all([AsyncStorage.getItem(KEYS.TAKEN_DATES), AsyncStorage.getItem(KEYS.CUSTOM_SUPPLEMENTS)]);

  return {
    takenDates: takenDates ? JSON.parse(takenDates) : {},
    customSupplements: customSupplements ? JSON.parse(customSupplements) : [],
  };
};

export const saveTakenDates = (value: Record<string, SupplementTime[]>) => AsyncStorage.setItem(KEYS.TAKEN_DATES, JSON.stringify(value));

export const saveCustomSupplements = (value: Supplement[]) => AsyncStorage.setItem(KEYS.CUSTOM_SUPPLEMENTS, JSON.stringify(value));

export const clearSupplementTakenDatesStore = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.TAKEN_DATES);
  } catch (err) {
    console.warn('supplementStorage: failed to clear taken dates', err);

    throw err;
  }
};

export const clearSupplementCustomStore = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(KEYS.CUSTOM_SUPPLEMENTS);
  } catch (err) {
    console.warn('supplementStorage: failed to clear custom supplements', err);

    throw err;
  }
};

export const getSupplementTakenDatesStorageSize = async (): Promise<number> => {
  return getStorageSize([KEYS.TAKEN_DATES]);
};

export const getSupplementCustomStorageSize = async (): Promise<number> => {
  return getStorageSize([KEYS.CUSTOM_SUPPLEMENTS]);
};
