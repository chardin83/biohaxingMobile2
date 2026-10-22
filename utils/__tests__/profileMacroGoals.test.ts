import type { DailyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { resolveNutritionTarget } from '@/services/targetProgress/nutritionTargetProgress';
import { getTipMacroGoals, getTipProteinGoal } from '@/utils/resolveNutritionTip';
import { matchesTipAge } from '@/utils/tipAge';

const tip = tips.find(item => item.id === 'profile_macro_goals')!;
const profile: UserProfile = {
  nutritionGuideCompleted: true, nutritionEnergySource: 'henry', nutritionDistribution: 'balanced',
  birthDate: '1980-01-01', weightKg: 70, heightCm: 170, biologicalSex: 'female', activityPal: 1.6,
  nutritionGoals: { protein: 100, carbohydrates: 250, fat: 70 },
};
const targetsFor = (user: UserProfile) => normalizeNutritionTargets(tip, user.weightKg, getTipProteinGoal(tip, user), getTipMacroGoals(tip, user));

it('applies from adulthood including ages below and above 65', () => {
  expect(matchesTipAge(tip, 17)).toBe(false);
  expect(matchesTipAge(tip, 18)).toBe(true);
  expect(matchesTipAge(tip, 65)).toBe(true);
});

it('uses all three saved macros exactly and updates when they change', () => {
  expect(targetsFor(profile)).toEqual([
    expect.objectContaining({ trackingKey: 'protein', amount: 100, labelGroup: 'macroLabels' }),
    expect.objectContaining({ trackingKey: 'carbohydrates', amount: 250, labelGroup: 'macroLabels' }),
    expect.objectContaining({ trackingKey: 'fat', amount: 70, labelGroup: 'macroLabels' }),
  ]);
  expect(targetsFor({ ...profile, nutritionGoals: { protein: 120, carbohydrates: 300, fat: 80 } }).map(target => target.amount)).toEqual([120, 300, 80]);
  expect(tip.macroTargets?.every(target => target.amount === 0)).toBe(true);
});

it.each([
  { nutritionEnergySource: 'custom' as const },
  { nutritionDistribution: 'custom' as const },
  { nutritionDistribution: undefined },
  { nutritionGuideCompleted: false },
  { activityPal: undefined },
  { birthDate: undefined },
  { nutritionGoals: undefined },
])('does not activate with custom or incomplete settings (%s)', updates => {
  expect(targetsFor({ ...profile, ...updates })).toEqual([]);
});

it('resolves carbohydrates and fat from meal totals, independently of protein', () => {
  const date = '2026-10-22';
  const dailyNutritionTracking: DailyNutritionTracking = {
    [date]: { date, entries: [], totals: { protein: 110, carbohydrates: 200, fat: 60, calories: 1780, fiber: 20 }, goalsMet: { protein: true, carbohydrates: false, fat: false, calories: false, fiber: false } },
  };
  const values = targetsFor(profile).map(target => resolveNutritionTarget({ target, selectedDate: date, dailyNutritionTracking, weeklyNutritionTracking: {} }));
  expect(values).toEqual([110, 200, 60]);
});
