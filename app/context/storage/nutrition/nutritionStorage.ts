import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  DailyNutritionTracking,
  WeeklyNutritionTracking,
} from './nutritionTypes';

const KEYS = {
  DAILY_NUTRITION_TRACKING: 'dailyNutritionTracking',
  WEEKLY_NUTRITION_TRACKING: 'weeklyNutritionTracking',
} as const;

export type NutritionStorage = {
  dailyNutritionTracking: DailyNutritionTracking;
  weeklyNutritionTracking: WeeklyNutritionTracking;
};

export const getNutritionStorage =
  async (): Promise<NutritionStorage> => {
    const [
      dailyNutritionTracking,
      weeklyNutritionTracking,
    ] = await Promise.all([
      AsyncStorage.getItem(
        KEYS.DAILY_NUTRITION_TRACKING
      ),
      AsyncStorage.getItem(
        KEYS.WEEKLY_NUTRITION_TRACKING
      ),
    ]);

    return {
      dailyNutritionTracking:
        dailyNutritionTracking
          ? JSON.parse(dailyNutritionTracking)
          : {},

      weeklyNutritionTracking:
        weeklyNutritionTracking
          ? JSON.parse(weeklyNutritionTracking)
          : {},
    };
  };

export const saveDailyNutritionTracking = (
  value: DailyNutritionTracking
) =>
  AsyncStorage.setItem(
    KEYS.DAILY_NUTRITION_TRACKING,
    JSON.stringify(value)
  );

export const saveWeeklyNutritionTracking = (
  value: WeeklyNutritionTracking
) =>
  AsyncStorage.setItem(
    KEYS.WEEKLY_NUTRITION_TRACKING,
    JSON.stringify(value)
  );