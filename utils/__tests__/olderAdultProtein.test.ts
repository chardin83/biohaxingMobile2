import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { tips } from '@/locales/tips';
import { normalizeNutritionTargets } from '@/services/targetProgress/normalizeNutritionTargets';
import { getTipProteinGoal, hasWeightBasedTargets, resolveNutritionTip } from '@/utils/resolveNutritionTip';
import { matchesTipAge } from '@/utils/tipAge';
import { isNutritionTipUntracked } from '@/utils/untrackedNutritionTips';

const tip = tips.find(item => item.id === 'protein_older_adults')!;
const profile: UserProfile = {
  birthDate: '1950-01-01', biologicalSex: 'female', weightKg: 70, heightCm: 165, activityPal: 1.6,
  nutritionGuideCompleted: true, nutritionEnergySource: 'henry',
  nutritionGoals: { protein: 120, carbohydrates: 220, fat: 65 },
};

it('targets adults from 65 with longevity as the main area', () => {
  expect(tip.minAge).toBe(65);
  expect(tip.areas[0].id).toBe('longevity');
  expect(matchesTipAge(tip, 64)).toBe(false);
  expect(matchesTipAge(tip, 65)).toBe(true);
  expect(tip.groupIds).toContain('amino_acids');
});

it('uses the exact saved macro protein goal rather than calculating a separate g/kg goal', () => {
  expect(hasWeightBasedTargets(tip)).toBe(false);
  const saved = getTipProteinGoal(tip, profile);
  expect(normalizeNutritionTargets(tip, 70, saved)).toEqual([expect.objectContaining({ trackingKey: 'protein', amount: 120, unit: 'g', period: 'daily' })]);
  expect(normalizeNutritionTargets(tip, 80, saved)[0].amount).toBe(120);
  expect(normalizeNutritionTargets(tip, 70, getTipProteinGoal(tip, { ...profile, nutritionGoals: { ...profile.nutritionGoals!, protein: 135 } }))[0].amount).toBe(135);
  expect(tip.proteinTargets?.[0].amount).toBe(0);
});

it.each([
  { nutritionGuideCompleted: false },
  { activityPal: undefined },
  { birthDate: undefined },
  { weightKg: undefined },
  { nutritionGoals: undefined },
])('requires completed automatic macro setup (%s)', missing => {
  const incomplete = { ...profile, ...missing };
  const saved = getTipProteinGoal(tip, incomplete);
  expect(saved).toBeUndefined();
  expect(normalizeNutritionTargets(tip, incomplete.weightKg, saved)).toEqual([]);
  expect(resolveNutritionTip(tip, incomplete.weightKg, saved).proteinTargets).toEqual([]);
  expect(isNutritionTipUntracked(tip, incomplete.weightKg, saved, true)).toBe(true);
});

it('accepts explicitly saved manual macro goals without requiring an automatic PAL calculation', () => {
  expect(getTipProteinGoal(tip, { nutritionGuideCompleted: true, nutritionEnergySource: 'custom', nutritionGoals: profile.nutritionGoals })).toBe(120);
  expect(getTipProteinGoal(tip, { ...profile, nutritionEnergySource: 'custom', nutritionGoals: { protein: 0, carbohydrates: 200, fat: 60 } })).toBeUndefined();
});
