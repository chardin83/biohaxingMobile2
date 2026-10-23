import type { DailyNutritionSummary, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import enTips from '@/locales/en/tips.json';
import svTips from '@/locales/sv/tips.json';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { getTargetProgress, type TargetProgressStorage } from '@/services/targetProgress/targetProgressService';
import { type FoodKey,getFoodProduct } from '@/utils/foodProduct';
import { scaleNutritionComposition } from '@/utils/nutritionComposition';
import { getNutritionTrackingAnalysis } from '@/utils/nutritionTrackingPrompt';

const date = '2026-10-23';
const beta = tips.find(tip => tip.id === 'oat_barley_beta_glucans_ldl')!;
const psyllium = tips.find(tip => tip.id === 'psyllium_ldl')!;
const emptyStorage = (): TargetProgressStorage => ({ dailyHabitTracking: {}, dailyTrainingTracking: {}, dailyNutritionTracking: {}, weeklyNutritionTracking: {}, takenDates: {} });
const foodEntry = (key: FoodKey, grams: number, id: string): NutritionEntry => ({
  ...scaleNutritionComposition(getFoodProduct(key, key).composition!, grams / 100),
  id, name: key, type: 'food', recordedAt: `${date}T12:00:00Z`,
});
const summary = (entries: NutritionEntry[]): DailyNutritionSummary => ({ date, entries,
  totals: { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0 },
  goalsMet: { calories: false, protein: false, carbohydrates: false, fat: false, fiber: false },
});

it('replaces the generic gel-fiber tip with two independent daily gram targets', () => {
  expect(tips.some(tip => tip.id === 'fiber_gel_forming_focus')).toBe(false);
  expect(normalizeNutritionTargets(beta)).toMatchObject([{ trackingKey: 'beta_glucans', amount: 3, unit: 'g', period: 'daily' }]);
  expect(normalizeNutritionTargets(psyllium)).toMatchObject([{ trackingKey: 'psyllium', amount: 5.2, unit: 'g', period: 'daily', supplementIds: [] }]);
  for (const tip of [beta, psyllium]) {
    expect(tip.groupIds).toContain('fiber_microbiome');
    for (const translations of [svTips, enTips]) expect(translations[tip.id as keyof typeof translations]).toMatchObject({ title: expect.any(String), description: expect.any(String), targetDescription: expect.any(String) });
  }
});

it('reuses existing fiber subtypes for both LDL tips without extra AI tracking prompts', () => {
  expect(beta.fiberTargets).toEqual([{ tag: 'beta_glucans', amount: 3, unit: 'g' }]);
  expect(beta.trackingTargets).toBeUndefined();
  const result = getNutritionTrackingAnalysis([{ tipId: beta.id }, { tipId: psyllium.id }], true);
  expect(psyllium.trackingTargets).toBeUndefined();
  expect(result.targets).toEqual([]);
});

it('sums existing beta-glucan subtype amounts across meals and resets daily', () => {
  const storage = emptyStorage();
  const target = normalizeNutritionTargets(beta)[0];
  const first = { ...foodEntry('oats', 50, 'a'), fiberSubtypeTotals: { beta_glucans: 1.2 } };
  const second = { ...foodEntry('oats', 50, 'b'), fiberSubtypeTotals: { beta_glucans: 1.8 } };
  storage.dailyNutritionTracking[date] = summary([first, second]);
  expect(getTargetProgress({ target, selectedDate: date, storage })).toMatchObject({ current: 3, isFulfilled: true });
  expect(getTargetProgress({ target, selectedDate: '2026-10-24', storage })).toMatchObject({ current: 0, isFulfilled: false });
});

it('tracks catalog psyllium using its gel-forming fiber fraction', () => {
  const storage = emptyStorage();
  const entry = foodEntry('psylliumHusk', 10, 'husk');
  expect(entry.fiber).toBe(8);
  expect(entry.fiberSubtypeTotals?.psyllium).toBeCloseTo(5.2);
  expect(entry.fiberSubtypeTotals?.psyllium).toBe(entry.fiberByType?.fiber_gel_forming);
  storage.dailyNutritionTracking[date] = summary([entry]);
  expect(getTargetProgress({ target: normalizeNutritionTargets(psyllium)[0], selectedDate: date, storage })).toMatchObject({ current: 5.2, isFulfilled: true });
  expect(getTargetProgress({ target: normalizeNutritionTargets(beta)[0], selectedDate: date, storage })).toMatchObject({ current: 0, isFulfilled: false });
});

it('uses scaled catalog beta-glucans and ignores old separate tracking signals', () => {
  const storage = emptyStorage();
  storage.dailyNutritionTracking[date] = summary([foodEntry('oats', 50, 'oats')]);
  const target = normalizeNutritionTargets(beta)[0];
  storage.weeklyNutritionTracking['2026-10-19'] = [
    { nutritionEntryId: 'oats', date, signals: { oat_barley_beta_glucans: 10 } },
  ];
  expect(getTargetProgress({ target, selectedDate: date, storage }).current).toBeCloseTo(2.2);
});

it('keeps psyllium food-only and does not count old supplement registrations', () => {
  expect(psyllium.supplements).toBeUndefined();
  const storage = emptyStorage();
  storage.takenDates[date] = [
    { id: 'fiber-product', name: 'Fiber supplement', quantity: '10', unit: 'g', time: '08:00', components: [{ id: 'psyllium', name: 'Psyllium fiber', quantity: '2.6', unit: 'g' }] },
    { id: 'psyllium', name: 'Psyllium fiber', quantity: '2600', unit: 'mg', time: '18:00' },
    { id: 'chia', name: 'Chia', quantity: '10', unit: 'g', time: '12:00' },
  ];
  expect(getTargetProgress({ target: normalizeNutritionTargets(psyllium)[0], selectedDate: date, storage })).toMatchObject({ current: 0, isFulfilled: false });
});
