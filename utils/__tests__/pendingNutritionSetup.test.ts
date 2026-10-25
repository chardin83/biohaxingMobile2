import type { PlansByCategory } from '@/app/context/storage/plans/planTypes';
import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { tips } from '@/locales/tips';
import { getPendingNutritionSetupTipId } from '@/utils/pendingNutritionSetup';
import { isNutritionTipUntracked } from '@/utils/untrackedNutritionTips';

const plan = (tipId: string): PlansByCategory['nutrition'] => [
  { tipId, startedAt: '2026-10-25', createdBy: 'user', editedBy: 'user', editedAt: '2026-10-25', planCategory: 'nutrition' },
];
const profile: UserProfile = {
  birthDate: '1990-01-01',
  weightKg: 70,
  heightCm: 170,
  biologicalSex: 'female',
  activityPal: 1.6,
  nutritionGuideCompleted: true,
  nutritionEnergySource: 'henry',
  nutritionDistribution: 'balanced',
  nutritionGoals: { protein: 140, carbohydrates: 220, fat: 65 },
};

it.each([
  { ...profile, weightKg: undefined },
  { ...profile, nutritionGoals: undefined },
  { ...profile, weightKg: 0 },
  { ...profile, nutritionGoals: { protein: 0, carbohydrates: 220, fat: 65 } },
])('detects unresolved weight or protein requirements', incomplete => {
  expect(getPendingNutritionSetupTipId(plan('protein_rotation'), incomplete)).toBe('protein_rotation');
});

it('removes the warning once the required information is provided', () => {
  expect(getPendingNutritionSetupTipId(plan('protein_rotation'), profile)).toBeUndefined();
});

it('excludes Premium-only restrictions even when the user has no profile details', () => {
  const tip = tips.find(item => item.id === 'plant_diversity_30_week')!;
  expect(isNutritionTipUntracked(tip, undefined, undefined, false)).toBe(true);
  expect(getPendingNutritionSetupTipId(plan(tip.id), {})).toBeUndefined();
});

it('detects an incomplete required macro guide even with saved numeric goals', () => {
  const tip = tips.find(item => item.requiresCalculatedMacros)!;
  expect(getPendingNutritionSetupTipId(plan(tip.id), { ...profile, nutritionGuideCompleted: false })).toBe(tip.id);
  expect(getPendingNutritionSetupTipId(plan(tip.id), profile)).toBeUndefined();
});

it('only considers active nutrition plans and ignores unknown tips', () => {
  expect(getPendingNutritionSetupTipId([], {})).toBeUndefined();
  expect(getPendingNutritionSetupTipId(plan('unknown-tip'), {})).toBeUndefined();
});
