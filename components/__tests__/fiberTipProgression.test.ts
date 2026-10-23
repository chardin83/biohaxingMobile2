import enTips from '@/locales/en/tips.json';
import svTips from '@/locales/sv/tips.json';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { getTargetProgress, type TargetProgressStorage } from '@/services/targetProgress/targetProgressService';

it('separates introductory resistant starch, total fibre and fermentable fibre targets', () => {
  const introductory = tips.find(tip => tip.id === 'resistant_starch_barrier')!;
  const total = tips.find(tip => tip.id === 'fiber_total_intake')!;
  const fermentable = tips.find(tip => tip.id === 'fiber_butyrate')!;
  expect(introductory.level).toBe(1);
  expect(introductory.targetPeriod).toBe('weekly');
  expect(introductory.habitTargets).toBeUndefined();
  expect(introductory.planCategory).toEqual(['nutrition']);
  expect(introductory.trackingTargets).toMatchObject([{ trackingKey: 'resistant_starch_meals', amount: 3, unit: 'count', aiInstruction: expect.stringContaining('Do not infer cooling') }]);
  expect(introductory.trackingTargets?.[0].aiInstruction).toContain('reheated after earlier cooling/refrigeration');
  expect(introductory.trackingTargets?.[0].aiInstruction).toContain('a small estimated resistant-starch amount alone must not qualify a freshly cooked meal');
  expect(introductory.fiberTargets).toBeUndefined();
  expect(introductory.nutritionFoods?.map(food => food.key)).toEqual(['greenBanana', 'cookedCooledPotato', 'cookedCooledPasta', 'cookedCooledJasmineRice', 'cookedCooledBasmatiRice']);
  expect(total.level).toBe(2);
  expect(total.fiberTargets).toMatchObject([{ tag: 'fiber_total', amount: 30 }]);
  expect(fermentable.level).toBe(3);
  expect(fermentable.fiberTargets).toMatchObject([{ tag: 'fiber_fermentable', amount: 15 }]);
  expect(fermentable.fiberTargets).toHaveLength(1);
  for (const tip of [introductory, total, fermentable]) {
    expect(tip.groupIds).toContain('fiber_microbiome');
    for (const translations of [svTips, enTips]) {
      const entry = translations[tip.id as keyof typeof translations];
      expect(entry.title).toBeTruthy();
      expect(entry.description).toBeTruthy();
    }
  }
});

it('counts AI nutrition contributions towards three meals weekly and resets next week', () => {
  const tip = tips.find(item => item.id === 'resistant_starch_barrier')!;
  const target = normalizeNutritionTargets(tip)[0];
  expect(target).toMatchObject({ source: 'nutrition', trackingKey: 'resistant_starch_meals', period: 'weekly', amount: 3 });
  const storage: TargetProgressStorage = {
    dailyHabitTracking: {}, dailyTrainingTracking: {}, dailyNutritionTracking: {}, weeklyNutritionTracking: {}, takenDates: {},
  };
  storage.weeklyNutritionTracking['2026-10-05'] = [
    { nutritionEntryId: 'meal-1', date: '2026-10-05', signals: { resistant_starch_meals: 1 } },
    { nutritionEntryId: 'meal-2', date: '2026-10-07', signals: { resistant_starch_meals: 1 } },
    { nutritionEntryId: 'unconfirmed-preparation', date: '2026-10-07', signals: { resistant_starch_meals: 0 } },
  ];
  expect(getTargetProgress({ target, selectedDate: '2026-10-09', storage })).toMatchObject({ current: 2, isFulfilled: false });
  storage.weeklyNutritionTracking['2026-10-05'].push({ nutritionEntryId: 'meal-3', date: '2026-10-09', signals: { resistant_starch_meals: 1 } });
  expect(getTargetProgress({ target, selectedDate: '2026-10-09', storage })).toMatchObject({ current: 3, isFulfilled: true });
  expect(getTargetProgress({ target, selectedDate: '2026-10-12', storage })).toMatchObject({ current: 0, isFulfilled: false });
});
