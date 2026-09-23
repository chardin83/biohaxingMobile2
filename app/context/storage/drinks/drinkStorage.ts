import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DailyDrinkTracking } from './drinkTypes';

const KEYS = {
  DAILY_DRINK_TRACKING: 'dailyDrinkTracking',
} as const;

export type DrinkStorage = {
  dailyDrinkTracking: DailyDrinkTracking;
};

export const getDrinkStorage = async (): Promise<DrinkStorage> => {
  const dailyDrinkTracking = await AsyncStorage.getItem(KEYS.DAILY_DRINK_TRACKING);

  return {
    dailyDrinkTracking: dailyDrinkTracking ? JSON.parse(dailyDrinkTracking) : {},
  };
};

export const saveDailyDrinkTracking = (value: DailyDrinkTracking) => AsyncStorage.setItem(KEYS.DAILY_DRINK_TRACKING, JSON.stringify(value));
