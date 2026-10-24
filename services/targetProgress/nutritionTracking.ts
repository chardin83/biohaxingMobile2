import type { WeeklyNutritionTracking, WeeklyNutritionValue, WeeklyTrackingItem } from '@/app/context/storage/nutrition/nutritionTypes';

const getItemIdentity = (item: WeeklyTrackingItem): string => (item.en || item.local).trim().toLowerCase();

// Keep the first display name, but identify plants/colors independently of language or preparation.
const uniqueItems = (items: WeeklyTrackingItem[]): WeeklyTrackingItem[] => {
  const byIdentity = new Map<string, WeeklyTrackingItem>();
  for (const item of items) {
    const identity = getItemIdentity(item);
    if (identity && !byIdentity.has(identity)) byIdentity.set(identity, item);
  }
  return [...byIdentity.values()];
};

export const getWeeklyNutritionValueCount = (value: WeeklyNutritionValue | undefined): number => {
  if (Array.isArray(value)) return uniqueItems(value).length;
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

export const aggregateWeeklyNutritionTracking = (
  weeklyNutritionTracking: WeeklyNutritionTracking,
  weekStartKey: string
): Record<string, WeeklyNutritionValue> => {
  const result: Record<string, WeeklyNutritionValue> = {};

  const contributions = weeklyNutritionTracking[weekStartKey] ?? [];

  contributions.forEach(contribution => {
    Object.entries(contribution.signals).forEach(([key, value]) => {
      const existing = result[key];
      if (Array.isArray(value)) {
        result[key] = uniqueItems([...(Array.isArray(existing) ? existing : []), ...value]);
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        result[key] = (typeof existing === 'number' ? existing : 0) + value;
      }
    });
  });

  return result;
};
