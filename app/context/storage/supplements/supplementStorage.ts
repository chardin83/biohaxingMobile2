import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Supplement } from '@/app/domain/Supplement';
import type { SupplementTime } from '@/app/domain/SupplementTime';

const KEYS = {
  TAKEN_DATES: 'takenDates',
  CUSTOM_SUPPLEMENTS: 'customSupplements',
} as const;

export type SupplementStorageData = {
  takenDates: Record<string, SupplementTime[]>;
  customSupplements: Supplement[];
};

export const getSupplementStorage =
  async (): Promise<SupplementStorageData> => {
    const [takenDates, customSupplements] =
      await Promise.all([
        AsyncStorage.getItem(KEYS.TAKEN_DATES),
        AsyncStorage.getItem(
          KEYS.CUSTOM_SUPPLEMENTS
        ),
      ]);

    return {
      takenDates: takenDates
        ? JSON.parse(takenDates)
        : {},
      customSupplements: customSupplements
        ? JSON.parse(customSupplements)
        : [],
    };
  };

export const saveTakenDates = (
  value: Record<string, SupplementTime[]>
) =>
  AsyncStorage.setItem(
    KEYS.TAKEN_DATES,
    JSON.stringify(value)
  );

export const saveCustomSupplements = (
  value: Supplement[]
) =>
  AsyncStorage.setItem(
    KEYS.CUSTOM_SUPPLEMENTS,
    JSON.stringify(value)
  );