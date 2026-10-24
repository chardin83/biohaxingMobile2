import type { WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import { resolveNutritionTarget } from '@/services/targetProgress/nutritionTargetProgress';
import { aggregateWeeklyNutritionTracking, getWeeklyNutritionValueCount } from '@/services/targetProgress/nutritionTracking';

it('uses the same unique plant list and count for weekly history and journal targets', () => {
  const weekly: WeeklyNutritionTracking = {
    '2026-10-19': [
      { nutritionEntryId: '1', date: '2026-10-20', signals: { unique_plants: [{ en: 'oat', local: 'Havre' }], vegetable_colors: [{ en: 'green', local: 'Grön' }], meals: 1 } },
      { nutritionEntryId: '2', date: '2026-10-21', signals: { unique_plants: [{ en: ' OAT ', local: 'Havrekli' }, { en: 'orange', local: 'Apelsin' }], vegetable_colors: [{ en: 'Green', local: 'Green' }], meals: 2 } },
    ],
  };
  const aggregated = aggregateWeeklyNutritionTracking(weekly, '2026-10-19');
  expect(aggregated.unique_plants).toEqual([{ en: 'oat', local: 'Havre' }, { en: 'orange', local: 'Apelsin' }]);
  expect(aggregated.vegetable_colors).toEqual([{ en: 'green', local: 'Grön' }]);
  for (const trackingKey of ['unique_plants', 'vegetable_colors', 'meals']) {
    const historyCount = getWeeklyNutritionValueCount(aggregated[trackingKey]);
    const journalCount = resolveNutritionTarget({
      target: { source: 'nutrition', trackingKey, period: 'weekly', unit: 'items', amount: 30 },
      selectedDate: '2026-10-24', dailyNutritionTracking: {}, weeklyNutritionTracking: weekly,
    });
    expect(historyCount).toBe(journalCount);
  }
  expect(getWeeklyNutritionValueCount(aggregated.unique_plants)).toBe(2);
  expect(aggregated.meals).toBe(3);
  weekly['2026-10-19'].shift();
  expect(aggregateWeeklyNutritionTracking(weekly, '2026-10-19').unique_plants).toEqual([{ en: ' OAT ', local: 'Havrekli' }, { en: 'orange', local: 'Apelsin' }]);
});

it('handles missing values, empty identities, and translated fallback identities consistently', () => {
  expect(getWeeklyNutritionValueCount(undefined)).toBe(0);
  expect(getWeeklyNutritionValueCount(Number.NaN)).toBe(0);
  expect(getWeeklyNutritionValueCount([{ en: '', local: '' }, { en: '', local: ' Havre ' }, { en: '', local: 'havre' }])).toBe(1);
});
