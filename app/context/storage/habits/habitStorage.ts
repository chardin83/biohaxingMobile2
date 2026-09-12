import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  DailyHabitTracking,
  HabitStorage,
} from './habitTypes';

const KEYS = {
  DAILY_HABIT_TRACKING:
    'dailyHabitTracking',
} as const;

export const getHabitStorage =
  async (): Promise<HabitStorage> => {
    const dailyHabitTracking =
      await AsyncStorage.getItem(
        KEYS.DAILY_HABIT_TRACKING
      );

    return {
      dailyHabitTracking:
        dailyHabitTracking
          ? JSON.parse(
              dailyHabitTracking
            )
          : {},
    };
  };

export const saveDailyHabitTracking = (
  value: DailyHabitTracking
) =>
  AsyncStorage.setItem(
    KEYS.DAILY_HABIT_TRACKING,
    JSON.stringify(value)
  );