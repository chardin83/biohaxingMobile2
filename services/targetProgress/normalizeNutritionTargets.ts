import { NutritionTargetDefinition } from '@/services/targetProgress/targetProgressTypes';

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
  trackingTargets?: any[];
};

export const normalizeNutritionTargets = (tip: NutritionTip): NutritionTargetDefinition[] => {
  const period = tip.targetPeriod;

  if (!period) {
    return [];
  }

  const tipSupplementIds = (tip.supplements ?? []).map(supplement => supplement.id).filter((id): id is string => Boolean(id));

  const targets: NutritionTargetDefinition[] = [
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
