import type { Tip } from '@/locales/tips';

import { getMissingNutritionSettings } from './resolveNutritionTip';

export function isNutritionTipUntracked(tip: Tip, weightKg: number | undefined, proteinGoal: number | undefined, premium: boolean): boolean {
  const missing = getMissingNutritionSettings(tip, weightKg, proteinGoal);
  return missing.weight || missing.proteinGoal || (!premium && Boolean(tip.trackingTargets?.some(target => target.aiInstruction?.trim())));
}
