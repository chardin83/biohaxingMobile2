import { NutritionTargetDefinition } from '@/services/targetProgress/targetProgressTypes';
import { hasProfileProteinTargets, hasValidProteinGoal, hasValidTargetWeight, hasWeightBasedTargets, resolveNutritionTip } from '@/utils/resolveNutritionTip';

type NutritionTip = {
  targetPeriod?: 'daily' | 'weekly';

  supplements?: Array<{
    id?: string;
  }>;

  fiberTargets?: any[];
  polyphenolTargets?: any[];
  mineralTargets?: any[];
  vitaminTargets?: any[];
  aminoAcidTargets?: any[];
  proteinTargets?: any[];
  trackingTargets?: any[];
};

export const normalizeNutritionTargets = (inputTip: NutritionTip, weightKg?: number, proteinGoal?: number): NutritionTargetDefinition[] => {
  // A completed protein goal must not complete a tip with unresolved amino acid goals.
  if (hasWeightBasedTargets(inputTip) && !hasValidTargetWeight(weightKg)) return [];
  if (hasProfileProteinTargets(inputTip) && !hasValidProteinGoal(proteinGoal)) return [];
  const tip = resolveNutritionTip(inputTip, weightKg, proteinGoal);
  const period = tip.targetPeriod;

  if (!period) {
    return [];
  }

  const tipSupplementIds = (tip.supplements ?? []).map(supplement => supplement.id).filter((id): id is string => Boolean(id));

  const targets: NutritionTargetDefinition[] = [
    ...(tip.proteinTargets ?? []).map(target => ({
      ...target,
      source: 'nutrition' as const,
      trackingKey: target.tag,
      period,
      labelGroup: 'macroLabels' as const,
    })),
    ...(tip.fiberTargets ?? []).map(target => ({
      ...target,

      source: 'nutrition' as const,

      trackingKey: target.tag,

      period,

      labelGroup: 'fiberLabels' as const,
    })),

    ...(tip.polyphenolTargets ?? []).map(target => ({
      ...target,

      source: 'nutrition' as const,

      trackingKey: target.tag,

      period,

      labelGroup: 'polyphenolLabels' as const,
    })),

    ...(tip.mineralTargets ?? []).map(target => ({
      ...target,

      source: 'nutrition' as const,

      trackingKey: target.tag,

      period,
      labelGroup: 'mineralLabels' as const,
    })),

    ...(tip.vitaminTargets ?? []).map(target => ({
      ...target,

      source: 'nutrition' as const,

      trackingKey: target.tag,

      period,
      labelGroup: 'vitaminLabels' as const,
    })),

    ...(tip.aminoAcidTargets ?? []).map(target => ({
      ...target,

      source: 'nutrition' as const,

      trackingKey: target.tag,

      period,
      labelGroup: 'aminoAcidLabels' as const,
    })),

    ...(tip.trackingTargets ?? []).map(target => ({
      ...target,

      source: 'nutrition' as const,

      trackingKey: target.trackingKey,

      period,

      labelGroup: 'weeklyTrackingLabels' as const,
    })),
  ];

  return targets.map(target => ({
    ...target,

    supplementIds: target.supplementIds?.length ? target.supplementIds : tipSupplementIds,
  }));
};
