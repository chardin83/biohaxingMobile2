import type { PlansByCategory } from '@/app/context/storage/plans/planTypes';
import { tips } from '@/locales/tips';

export const GOAL_CATEGORIES = ['training', 'nutrition', 'other'] as const;
export type GoalCategory = typeof GOAL_CATEGORIES[number];

export function getPlannedGoalCategories(plans: PlansByCategory): Set<GoalCategory> {
  const categories = new Set<GoalCategory>();
  for (const category of GOAL_CATEGORIES) {
    if (plans[category].some(plan => {
      const tip = tips.find(item => item.id === plan.tipId);
      return tip?.targetPeriod && [
        tip.fiberTargets, tip.polyphenolTargets, tip.mineralTargets, tip.vitaminTargets,
        tip.aminoAcidTargets, tip.nutrientTargets, tip.trackingTargets,
        tip.hydrationTargets, tip.activityTargets, tip.habitTargets,
      ].some(targets => targets && targets.length > 0);
    })) categories.add(category);
  }
  return categories;
}
