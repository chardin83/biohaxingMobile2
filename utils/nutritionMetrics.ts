import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { DailyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';

/** Daily logged energy; empty days are unknown rather than zero intake. */
export function buildCalorieMetrics(tracking: DailyNutritionTracking): MetricEntry[] {
  return Object.entries(tracking).flatMap(([date, summary]) => {
    const entries = summary.entries.filter(entry => Number.isFinite(entry.calories) && entry.calories >= 0);
    if (!entries.length) return [];
    return [{
      metricId: 'calories' as const,
      value: entries.reduce((total, entry) => total + entry.calories, 0),
      unit: 'kcal',
      origin: 'nutrition' as const,
      recordedAt: `${date}T00:00:00`,
    }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}
