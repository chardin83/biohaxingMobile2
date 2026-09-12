import AsyncStorage from '@react-native-async-storage/async-storage';

import { DailyNutritionSummary, WeeklyTracking } from './nutritionTypes';

const KEYS = {
  DAILY_NUTRITION: 'dailyNutritionSummary',
  WEEKLY_TRACKING: 'weeklyTracking',
} as const;

export const getNutritionStorage = async () => {
  const [nutrition, weeklyTracking] =
    await Promise.all([
      AsyncStorage.getItem(KEYS.DAILY_NUTRITION),
      AsyncStorage.getItem(KEYS.WEEKLY_TRACKING),
    ]);

  return {
    dailyNutritionSummaries:
      nutrition
        ? JSON.parse(nutrition)
        : {},
    weeklyTracking:
      weeklyTracking
        ? JSON.parse(weeklyTracking)
        : {},
  } as {
    dailyNutritionSummaries: Record<
      string,
      DailyNutritionSummary
    >;
    weeklyTracking: WeeklyTracking;
  };
};

export const saveDailyNutritionSummaries = (
  value: Record<string, DailyNutritionSummary>
) =>
  AsyncStorage.setItem(
    KEYS.DAILY_NUTRITION,
    JSON.stringify(value)
  );

export const saveWeeklyTracking = (
  value: WeeklyTracking
) =>
  AsyncStorage.setItem(
    KEYS.WEEKLY_TRACKING,
    JSON.stringify(value)
  );