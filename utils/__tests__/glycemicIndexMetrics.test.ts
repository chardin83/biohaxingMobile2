import type { DailyNutritionTracking, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { buildGlycemicIndexMetrics } from '../glycemicIndexMetrics';

const food = (carbohydrates: number, glycemicIndex?: number): NutritionEntry => ({
  id: 'food', name: 'Food', type: 'food', recordedAt: '2026-10-23T12:00:00',
  calories: 100, protein: 0, fat: 0, fiber: 0, carbohydrates, glycemicIndex,
});
const tracking = (entries: NutritionEntry[]): DailyNutritionTracking => ({
  '2026-10-23': { date: '2026-10-23', entries, totals: { calories: 0, protein: 0, fat: 0, fiber: 0, carbohydrates: 0, glycemicIndex: 999 },
    goalsMet: { calories: false, protein: false, fat: false, fiber: false, carbohydrates: false } },
});

it('derives daily GI from logged entries, excluding unknown GI and zero-carb entries', () => {
  expect(buildGlycemicIndexMetrics(tracking([food(10, 40), food(30, 60), food(100), food(0, 100)]))).toEqual([
    { metricId: 'glycemic_index', origin: 'nutrition', value: 55, unit: 'index', recordedAt: '2026-10-23T00:00:00' },
  ]);
});

it('recomputes after food edits and removals rather than using stale saved totals', () => {
  expect(buildGlycemicIndexMetrics(tracking([food(10, 40)]))[0].value).toBe(40);
  expect(buildGlycemicIndexMetrics(tracking([food(10, 70)]))[0].value).toBe(70);
  expect(buildGlycemicIndexMetrics(tracking([]))).toEqual([]);
});

it('omits days without known GI, preserves genuine zero and rejects invalid values', () => {
  expect(buildGlycemicIndexMetrics(tracking([food(20)]))).toEqual([]);
  expect(buildGlycemicIndexMetrics(tracking([food(20, NaN)]))).toEqual([]);
  expect(buildGlycemicIndexMetrics(tracking([food(20, 0)]))[0].value).toBe(0);
});
