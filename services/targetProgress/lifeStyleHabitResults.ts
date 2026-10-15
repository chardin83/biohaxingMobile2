import type { DailyHabitTracking } from '@/app/context/storage/habits/habitTypes';
import type { LifeStyleLog } from '@/app/context/storage/lifeStyle/lifeStyleTypes';
import type { PlanTipEntry } from '@/app/context/storage/plans/planTypes';
import { tips } from '@/locales/tips';
import { toDateKey } from '@/utils/dateUtils';

export function storeLifeStyleHabitResults(tracking: DailyHabitTracking, log: LifeStyleLog, plans: PlanTipEntry[], today = toDateKey(new Date())): DailyHabitTracking {
  let updated = tracking;
  const dates = new Set([...Object.keys(log), ...Object.keys(tracking)]);
  for (const plan of plans) {
    const start = new Date(plan.startedAt);
    if (!Number.isFinite(start.getTime())) continue;
    const tip = tips.find(item => item.id === plan.tipId);
    for (const target of tip?.habitTargets ?? []) {
      if (!target.lifeStyleKeys) continue;
      for (const date of dates) {
        if (date < toDateKey(start) || date > today) continue;
        const existing = updated[date]?.[target.trackingKey];
        const value = target.lifeStyleKeys.filter(key => typeof log[date]?.[key]?.value === 'boolean').length;
        if (!value) {
          if (!existing) continue;
          const day = { ...updated[date] };
          delete day[target.trackingKey];
          updated = { ...updated, [date]: day };
          if (!Object.keys(day).length) delete updated[date];
          continue;
        }
        const targetAmount = existing?.source === 'lifeStyle' ? (existing.targetAmount ?? target.amount) : target.amount;
        const isFulfilled = tip?.targetPeriod === 'daily' ? value >= targetAmount : undefined;
        if (existing?.source === 'lifeStyle' && existing.value === value && existing.targetAmount === targetAmount && existing.isFulfilled === isFulfilled) continue;
        updated = {
          ...updated,
          [date]: { ...updated[date], [target.trackingKey]: { source: 'lifeStyle', value, targetAmount, isFulfilled } },
        };
      }
    }
  }
  return updated;
}
