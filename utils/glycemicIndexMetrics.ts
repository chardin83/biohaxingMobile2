import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { DailyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';

import { getGlycemicIndexSummary, getWeightedGlycemicIndex } from './glycemicIndex';

/** Derived from entries so edits/removals and older stored summaries stay consistent. */
export function buildGlycemicIndexMetrics(tracking: DailyNutritionTracking): MetricEntry[] {
  return Object.entries(tracking).flatMap(([date, summary]) => {
    const value = getWeightedGlycemicIndex(summary.entries);
    return value === undefined ? [] : [{
      metricId: 'glycemic_index' as const,
      value,
      unit: 'index',
      origin: 'nutrition' as const,
      // Local midnight keeps the nutrition date intact in tables and latest-value filters.
      recordedAt: `${date}T00:00:00`,
    }];
  }).sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function buildGlycemicIndexCoverage(tracking: DailyNutritionTracking) {
  return Object.entries(tracking).map(([date, summary]) => {
    const { knownCarbohydrates, totalCarbohydrates } = getGlycemicIndexSummary(summary.entries);
    return { date, knownCarbohydrates, totalCarbohydrates };
  });
}
