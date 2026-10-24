import type { NutritionCompletionInputs } from '@/services/targetProgress/completedNutritionProgress';
import { getNutritionInputSignature } from '@/services/targetProgress/completedNutritionProgress';

const date = '2026-10-24';
const inputs: NutritionCompletionInputs = { dailyNutritionTracking: {}, weeklyNutritionTracking: {}, takenDates: {} };

it('stores a compact checksum rather than a duplicate of the nutrition inputs', () => {
  const changed: NutritionCompletionInputs = { ...inputs, weeklyNutritionTracking: { '2026-10-19': [{ nutritionEntryId: 'meal-1', date, signals: { unique_plants: [{ en: 'cabbage', local: 'vitkål' }] } }] } };
  const signature = getNutritionInputSignature('daily', date, changed);
  expect(signature).toMatch(/^fnv1a64:[0-9a-f]{16}$/);
  expect(signature).not.toContain('cabbage');
  expect(signature).toBe(getNutritionInputSignature('daily', date, structuredClone(changed)));
  expect(signature).not.toBe(getNutritionInputSignature('daily', date, inputs));
});

it('detects GI review changes without changing signatures for other dates', () => {
  const changed: NutritionCompletionInputs = { ...inputs, dailyHabitTracking: { [date]: { glycemic_index_review: { value: 1, isFulfilled: true } } } };
  expect(getNutritionInputSignature('daily', date, inputs)).not.toBe(getNutritionInputSignature('daily', date, changed));
  expect(getNutritionInputSignature('daily', '2026-10-23', inputs)).toBe(getNutritionInputSignature('daily', '2026-10-23', changed));
});
