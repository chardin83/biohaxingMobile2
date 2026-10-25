import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';

import { calculateEnergyNeeds } from './energyNeeds';

type WeightBasedTarget = { amount: number; amountPerKg?: number };
type WeightBasedTip = {
  aminoAcidTargets?: readonly WeightBasedTarget[];
  proteinTargets?: readonly { amount: number; fromUserProteinGoal?: boolean }[];
  requiresMacroSetup?: boolean;
  requiresCalculatedMacros?: boolean;
  macroTargets?: readonly { tag: 'protein' | 'carbohydrates' | 'fat'; amount: number }[];
};

export function hasWeightBasedTargets(tip: WeightBasedTip | undefined): boolean {
  return Boolean(tip?.aminoAcidTargets?.some(target => target.amountPerKg !== undefined));
}

export function hasValidTargetWeight(weightKg: number | undefined): weightKg is number {
  return typeof weightKg === 'number' && Number.isFinite(weightKg) && weightKg > 0;
}

export function hasProfileProteinTargets(tip: WeightBasedTip | undefined): boolean {
  return Boolean(tip?.macroTargets?.length || tip?.proteinTargets?.some(target => target.fromUserProteinGoal));
}

export function hasValidProteinGoal(proteinGoal: number | undefined): proteinGoal is number {
  return typeof proteinGoal === 'number' && Number.isFinite(proteinGoal) && proteinGoal > 0;
}

/** Read saved goals; never calculate a separate protein goal for a tip. */
export function getTipProteinGoal(tip: WeightBasedTip | undefined, profile?: UserProfile): number | undefined {
  if (tip?.macroTargets?.length && profile?.trackMacros === false) return undefined;
  const protein = profile?.nutritionGoals?.protein;
  if (tip?.requiresCalculatedMacros && (
    profile?.nutritionEnergySource !== 'henry' ||
    !profile.nutritionDistribution || profile.nutritionDistribution === 'custom'
  )) return undefined;
  if (!tip?.requiresMacroSetup) return protein;
  if (!profile?.nutritionGuideCompleted || !hasValidProteinGoal(protein)) return undefined;
  const goals = profile.nutritionGoals;
  if (!goals || ![goals.carbohydrates, goals.fat].every(value => Number.isFinite(value) && value >= 0)) return undefined;
  if (profile.nutritionEnergySource === 'henry' && !calculateEnergyNeeds(profile)) return undefined;
  return protein;
}

export function getTipMacroGoals(tip: WeightBasedTip | undefined, profile?: UserProfile): UserProfile['nutritionGoals'] {
  return hasValidProteinGoal(getTipProteinGoal(tip, profile)) ? profile?.nutritionGoals : undefined;
}

export function getMissingNutritionSettings(tip: WeightBasedTip | undefined, weightKg?: number, proteinGoal?: number) {
  return {
    weight: hasWeightBasedTargets(tip) && !hasValidTargetWeight(weightKg),
    proteinGoal: hasProfileProteinTargets(tip) && !hasValidProteinGoal(proteinGoal),
  };
}

/** Never turn an unresolved weight-based target into a fulfilled zero goal. */
export function resolveNutritionTip<T extends WeightBasedTip>(tip: T, weightKg?: number, proteinGoal?: number, macroGoals?: UserProfile['nutritionGoals']): T {
  if (!hasWeightBasedTargets(tip) && !hasProfileProteinTargets(tip)) return tip;
  return {
    ...tip,
    macroTargets: tip.macroTargets?.flatMap(target => {
      const amount = macroGoals?.[target.tag];
      return typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 ? [{ ...target, amount }] : [];
    }),
    proteinTargets: tip.proteinTargets?.flatMap(target => {
      if (!target.fromUserProteinGoal) return [target];
      if (!hasValidProteinGoal(proteinGoal)) return [];
      return [{ ...target, amount: proteinGoal }];
    }),
    aminoAcidTargets: tip.aminoAcidTargets?.flatMap(target => {
      if (target.amountPerKg === undefined) return [target];
      if (!hasValidTargetWeight(weightKg)) return [];
      return [{ ...target, amount: target.amountPerKg * weightKg }];
    }),
  };
}
