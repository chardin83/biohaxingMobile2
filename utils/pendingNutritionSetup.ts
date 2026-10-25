import type { PlansByCategory } from '@/app/context/storage/plans/planTypes';
import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { tips } from '@/locales/tips';

import { getMissingNutritionSettings, getTipProteinGoal } from './resolveNutritionTip';

/** Same profile requirements and order as the journal's untracked-goal section. */
export function getPendingNutritionSetupTipId(plans: PlansByCategory['nutrition'], profile?: UserProfile): string | undefined {
  const plannedIds = new Set(plans.map(plan => plan.tipId));
  return tips.find(tip => {
    if (!plannedIds.has(tip.id)) return false;
    const missing = getMissingNutritionSettings(tip, profile?.weightKg, getTipProteinGoal(tip, profile));
    return missing.weight || missing.proteinGoal;
  })?.id;
}
