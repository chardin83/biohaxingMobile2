type WeightBasedTarget = { amount: number; amountPerKg?: number };
type WeightBasedTip = {
  aminoAcidTargets?: readonly WeightBasedTarget[];
  proteinTargets?: readonly { amount: number; fromUserProteinGoal?: boolean }[];
};

export function hasWeightBasedTargets(tip: WeightBasedTip | undefined): boolean {
  return Boolean(tip?.aminoAcidTargets?.some(target => target.amountPerKg !== undefined));
}

export function hasValidTargetWeight(weightKg: number | undefined): weightKg is number {
  return typeof weightKg === 'number' && Number.isFinite(weightKg) && weightKg > 0;
}

export function hasProfileProteinTargets(tip: WeightBasedTip | undefined): boolean {
  return Boolean(tip?.proteinTargets?.some(target => target.fromUserProteinGoal));
}

export function hasValidProteinGoal(proteinGoal: number | undefined): proteinGoal is number {
  return typeof proteinGoal === 'number' && Number.isFinite(proteinGoal) && proteinGoal > 0;
}

export function getMissingNutritionSettings(tip: WeightBasedTip | undefined, weightKg?: number, proteinGoal?: number) {
  return {
    weight: hasWeightBasedTargets(tip) && !hasValidTargetWeight(weightKg),
    proteinGoal: hasProfileProteinTargets(tip) && !hasValidProteinGoal(proteinGoal),
  };
}

/** Never turn an unresolved weight-based target into a fulfilled zero goal. */
export function resolveNutritionTip<T extends WeightBasedTip>(tip: T, weightKg?: number, proteinGoal?: number): T {
  if (!hasWeightBasedTargets(tip) && !tip.proteinTargets?.some(target => target.fromUserProteinGoal)) return tip;
  return {
    ...tip,
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
