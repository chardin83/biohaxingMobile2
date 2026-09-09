import AsyncStorage from '@react-native-async-storage/async-storage';

import type { WeeklyTrackingItem } from '@/components/nutritionTargets.logic';
import type { MineralType } from '@/constants/minerals';
import type { NutritionComposition } from '@/types/nutritionProfile';

export type MealNutrition =
  NutritionComposition & {
    id?: string;
    date: string;
    mealName?: string;
    mineralsConfidenceByType?: Partial<
      Record<
        MineralType,
        'high' | 'medium' | 'low' | 'unknown'
      >
    >;
  };

export type DailyNutritionSummary = {
  date: string;
  meals: MealNutrition[];
  totals: {
    protein: number;
    calories: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
  };
  goalsMet: {
    protein: boolean;
    calories: boolean;
    carbohydrates: boolean;
    fat: boolean;
    fiber: boolean;
  };
};

export type WeeklyTracking = Record<
  string,
  Record<string, WeeklyTrackingItem[] | number>
>;

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