import type { DailyNutritionTracking, TipTargetItem, WeeklyNutritionTracking } from '@/app/context/storage/nutrition/nutritionTypes';
import type { NutritionXpClaim } from '@/app/context/storage/xp/xpTyptes';
import type { SupplementTime } from '@/app/domain/SupplementTime';
import type { NutritionTargetPeriod } from '@/types/nutrition/nutritionTargets';

import { getTargetDates } from './dateRange';

export function getNutritionCompletion(claims: Record<string, NutritionXpClaim> | undefined, tipId: string, period: NutritionTargetPeriod, date: string) {
  const periodKey = period === 'weekly' ? getTargetDates(date, 'weekly')[0] : date;
  return claims?.[`${tipId}|${period}|${periodKey}`];
}

export function restoreCompletedNutritionTargets(current: TipTargetItem[], completion: NutritionXpClaim | undefined): TipTargetItem[] {
  if (!completion) return current;
  return completion.targets.map(saved => ({
    ...saved,
    isMet: true,
    label: current.find(target => target.tag === saved.tag && target.unit === saved.unit)?.label ?? saved.label,
  }));
}

export type NutritionCompletionInputs = {
  dailyNutritionTracking: DailyNutritionTracking;
  weeklyNutritionTracking: WeeklyNutritionTracking;
  takenDates: Record<string, SupplementTime[]>;
};

export function getNutritionInputSignature(period: NutritionTargetPeriod, date: string, inputs: NutritionCompletionInputs): string {
  const dates = getTargetDates(date, period);
  return JSON.stringify({
    days: dates.map(day => [day, inputs.dailyNutritionTracking[day] ?? null, inputs.takenDates[day] ?? []]),
    weekly: period === 'weekly' ? inputs.weeklyNutritionTracking[dates[0]] ?? null : null,
  });
}

// XP claims remain stored even when their completion snapshot is no longer valid.
export function getCurrentNutritionCompletions(claims: Record<string, NutritionXpClaim>, inputs: NutritionCompletionInputs): Record<string, NutritionXpClaim> {
  return Object.fromEntries(Object.entries(claims).filter(([, claim]) =>
    claim.inputSignature === getNutritionInputSignature(claim.period, claim.periodKey, inputs)
  ));
}
