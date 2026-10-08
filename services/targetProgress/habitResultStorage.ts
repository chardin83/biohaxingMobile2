import type { DailyHabitTracking, HabitEntry } from '@/app/context/storage/habits/habitTypes';
import type { MetricEntry } from '@/app/context/storage/metrics/metricTypes';
import type { PlanTipEntry } from '@/app/context/storage/plans/planTypes';
import type { UserProfile } from '@/app/context/storage/userProfile/userProfileTypes';
import { tips } from '@/locales/tips';
import { toDateKey } from '@/utils/dateUtils';

import { getSleepScheduleAssessment } from './sleepScheduleProgress';

export const getActiveHabitTarget = (plans: PlanTipEntry[], key: string, date: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > toDateKey(new Date())) return undefined;
  for (const plan of plans) {
    const started = new Date(plan.startedAt);
    if (Number.isNaN(started.getTime()) || date < toDateKey(started)) continue;
    const tip = tips.find(item => item.id === plan.tipId);
    const target = tip?.habitTargets?.find(item => item.trackingKey === key);
    if (target) return { target, period: tip!.targetPeriod };
  }
  return undefined;
};

export const prepareManualHabitResult = (plans: PlanTipEntry[], key: string, date: string, entry: HabitEntry): HabitEntry | undefined => {
  const active = getActiveHabitTarget(plans, key, date);
  if (!active || active.target.inputMode === 'automatic' || !Number.isFinite(entry.value) || entry.value < 0) return undefined;
  return {
    ...entry,
    targetAmount: active.target.amount,
    isFulfilled: active.period === 'daily' ? entry.value >= active.target.amount : undefined,
  };
};

// Run on ingestion, not while rendering progress. Index each night's latest record once.
export const storeAutomaticSleepResults = (
  tracking: DailyHabitTracking,
  entries: MetricEntry[],
  plans: PlanTipEntry[],
  profile: UserProfile
): DailyHabitTracking => {
  const key = 'sleep_schedule_consistency';
  if (!plans.some(plan => plan.tipId === 'sleep_timing_circadian')) return tracking;
  const latest = new Map<string, MetricEntry>();
  for (const entry of entries) {
    if (entry.metricId !== 'sleep_bedtime' || !Number.isFinite(entry.value) || entry.value < 0 || entry.value >= 1440) continue;
    const recorded = new Date(entry.recordedAt);
    if (Number.isNaN(recorded.getTime())) continue;
    const date = toDateKey(recorded);
    const previous = latest.get(date);
    if (!previous || recorded.getTime() >= new Date(previous.recordedAt).getTime()) latest.set(date, entry);
  }
  let updated = tracking;
  for (const [date, entry] of latest) {
    const active = getActiveHabitTarget(plans, key, date);
    if (!active) continue;
    const existing = tracking[date]?.[key];
    const sourceRevision = `${entry.recordedAt}|${entry.value}|${entry.unit}`;
    if (existing?.sourceRevision === sourceRevision && existing.sleepSchedule) continue;
    // Corrections keep the original goal. A settings change alone never changes a saved result.
    const bedtime = existing?.sleepSchedule?.targetBedtime ?? profile.bedtime ?? '23:00';
    const assessment = getSleepScheduleAssessment(date, [entry], { ...profile, bedtime });
    if (assessment.status === 'noData') continue;
    if (updated === tracking) updated = { ...tracking };
    updated[date] = {
      ...updated[date],
      [key]: {
        value: assessment.status === 'fulfilled' ? 1 : 0,
        isFulfilled: assessment.status === 'fulfilled',
        targetAmount: active.target.amount,
        sourceRevision,
        sleepSchedule: assessment,
      },
    };
  }
  return updated;
};
