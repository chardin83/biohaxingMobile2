import type { DailyNutritionTracking, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';

import { buildCalorieMetrics } from '../nutritionMetrics';

const entry = (calories: number, type: NutritionEntry['type'] = 'food'): NutritionEntry => ({
  id: 'entry', name: 'Food', recordedAt: '2026-10-26T12:00:00', type,
  calories, protein: 0, fat: 0, fiber: 0, carbohydrates: 0,
});
const tracking = (entries: NutritionEntry[]): DailyNutritionTracking => ({
  '2026-10-26': {
    date: '2026-10-26', entries,
    totals: { calories: 999, protein: 0, fat: 0, fiber: 0, carbohydrates: 0 },
    goalsMet: { calories: false, protein: false, fat: false, fiber: false, carbohydrates: false },
  },
});
it('sums logged food and drinks, ignoring stale saved totals', () => {
  expect(buildCalorieMetrics(tracking([entry(400), entry(150, 'drink')]))).toEqual([
    { metricId: 'calories', origin: 'nutrition', value: 550, unit: 'kcal', recordedAt: '2026-10-26T00:00:00' },
  ]);
});
it('recomputes edits and removals and omits empty days', () => {
  expect(buildCalorieMetrics(tracking([entry(300)]))[0].value).toBe(300);
  expect(buildCalorieMetrics(tracking([]))).toEqual([]);
  expect(buildCalorieMetrics({})).toEqual([]);
});
it('preserves genuine zero and excludes invalid energy values', () => {
  expect(buildCalorieMetrics(tracking([entry(NaN), entry(-10), entry(Infinity)]))).toEqual([]);
  expect(buildCalorieMetrics(tracking([entry(0)]))[0].value).toBe(0);
});
