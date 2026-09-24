import type { WeeklyNutritionTracking, WeeklyNutritionValue } from '@/app/context/storage/nutrition/nutritionTypes';
import { mergeWeeklyTrackingSignal, type WeeklyTrackingSignals } from '@/utils/analyzeNutrition';

export const aggregateWeeklyNutritionTracking = (
  weeklyNutritionTracking: WeeklyNutritionTracking,
  weekStartKey: string
): Record<string, WeeklyNutritionValue> => {
  const result: WeeklyTrackingSignals = {};

  const contributions = weeklyNutritionTracking[weekStartKey] ?? [];

  contributions.forEach(contribution => {
    Object.entries(contribution.signals).forEach(([key, value]) => {
      mergeWeeklyTrackingSignal(result, key, value);
    });
  });

  return result;
};
