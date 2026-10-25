import type { ArchivedPlansByCategory } from '@/app/context/storage/plans/planTypes';

// The AI only needs to know what was tried and when, not private comments.
export function getArchivedPlanContext(plans: ArchivedPlansByCategory) {
  const tips = (entries: ArchivedPlansByCategory['training']) => entries.map(({ tipId, startedAt, endedAt }) => ({ tipId, startedAt, endedAt }));
  return {
    training: tips(plans.training),
    nutrition: tips(plans.nutrition),
    other: tips(plans.other),
    supplements: plans.supplements.map(({ supplement, startedAt, endedAt }) => ({ supplementId: supplement.id, name: supplement.name, startedAt, endedAt })),
  };
}
