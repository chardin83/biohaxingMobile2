import { tips } from '@/locales/tips';

export function getNutritionTrackingAnalysis(planTips: readonly { tipId: string }[], premium: boolean) {
  const byKey = new Map<string, { key: string; unit: 'items' | 'count'; amount: number; aiInstruction?: string }>();
  for (const plan of planTips) {
    const tip = tips.find(candidate => candidate.id === plan.tipId);
    for (const target of tip?.trackingTargets ?? []) {
      const key = target.trackingKey.trim();
      if (!key || (!premium && target.aiInstruction?.trim()) || byKey.has(key)) continue;
      byKey.set(key, { key, unit: target.unit, amount: target.amount, aiInstruction: target.aiInstruction });
    }
  }
  const targets = [...byKey.values()];
  const prompt = targets.length ? [
    'nutrition_analysis',
    'tracking_targets_for_this_user:',
    JSON.stringify(targets),
    'Only return weeklyTrackingSignals keys that exist in tracking_targets_for_this_user.',
    'Report this meal only, even for daily targets; the app aggregates by date.',
    'For unit=items return rows with key and items:[{en,local}]. For unit=count return rows with key and countIncrement.',
    'Do not infer hidden ingredients or report the goal amount as the detected amount.',
  ].join('\n') : 'nutrition_analysis';
  return { targets, keys: new Set(byKey.keys()), prompt };
}
