import { TFunction } from 'i18next';

import { tips } from '@/locales/tips';
import {
  type NutritionTargetPeriod,
  type NutritionTargetUnit,
} from '@/types/nutritionTargets';

import { isAminoAcidTargetTag } from '../constants/aminoAcids';
import { isMineralTargetTag } from '../constants/minerals';
import { isVitaminTargetTag } from '../constants/vitamins';
import {
  type WeeklyTrackingSignals,
  type WeeklyTrackingSignalValue,
} from '../utils/analyzeNutrition';
import { type TipProgressItem } from './NutritionPlanTargetsSection';

type TipLabelGroup =
  | 'weeklyTrackingLabels'
  | 'fiberLabels'
  | 'aminoAcidLabels'
  | 'mineralLabels'
  | 'vitaminLabels'
  | 'polyphenolLabels';

type PlanTarget = {
  tag?: string;
  trackingKey?: string;
  unit: NutritionTargetUnit;
  amount: number;
};

type PlanTip = {
  tipId: string;
};

export type NutritionPlanProgressContext = {
  plans: any;
  summary: any;
  t: TFunction;
  weekStartKey: string;
  dailyTracking: WeeklyTrackingSignals;
  weeklyTracking: Record<string, WeeklyTrackingSignals>;
  dailyFiberByType: Record<string, number>;
  dailyPolyphenolByType: Record<string, number>;
  dailyMineralsByType: Record<string, number>;
  dailyVitaminsByType: Record<string, number>;
  dailyAminoAcidsByType: Record<string, number>;
  weeklyFiberByType: Record<string, number>;
  weeklyPolyphenolByType: Record<string, number>;
  weeklyMineralsByType: Record<string, number>;
  weeklyVitaminsByType: Record<string, number>;
  weeklyAminoAcidsByType: Record<string, number>;
  weeklyFiberTotal: number;
};

const getTipLabelGroup = (unit: string, trackingKey: string): TipLabelGroup => {
  if (unit === 'items' || unit === 'count') return 'weeklyTrackingLabels';
  if (unit === 'g') return 'fiberLabels';
  if (isAminoAcidTargetTag(trackingKey)) return 'aminoAcidLabels';
  if (isMineralTargetTag(trackingKey)) return 'mineralLabels';
  if (isVitaminTargetTag(trackingKey)) return 'vitaminLabels';
  return 'polyphenolLabels';
};

const getDailyTargetValueFromContext = (
  tag: string,
  unit: NutritionTargetUnit,
  context: NutritionPlanProgressContext
): number => {
  if (unit === 'plants' || unit === 'items' || unit === 'count') {
    return 0;
  }
  if (unit === 'g') {
    if (tag === 'fiber_total') return context.summary?.totals.fiber ?? 0;
    return context.dailyFiberByType[tag] ?? 0;
  }
  if (isAminoAcidTargetTag(tag)) {
    return context.dailyAminoAcidsByType[tag] ?? 0;
  }
  if (isMineralTargetTag(tag)) {
    return context.dailyMineralsByType[tag] ?? 0;
  }
  if (isVitaminTargetTag(tag)) {
    return context.dailyVitaminsByType[tag] ?? 0;
  }
  return context.dailyPolyphenolByType[tag] ?? 0;
};

const getWeeklyTargetValueFromContext = (
  tag: string,
  unit: NutritionTargetUnit,
  context: NutritionPlanProgressContext
): number => {
  if (unit === 'plants' || unit === 'items' || unit === 'count') {
    const value = context.weeklyTracking[context.weekStartKey]?.[tag];
    if (typeof value === 'number') return value;
    if (Array.isArray(value)) return value.length;
    return 0;
  }
  if (unit === 'g') {
    if (tag === 'fiber_total') return context.weeklyFiberTotal;
    return context.weeklyFiberByType[tag] ?? 0;
  }
  if (isAminoAcidTargetTag(tag)) {
    return context.weeklyAminoAcidsByType[tag] ?? 0;
  }
  if (isMineralTargetTag(tag)) {
    return context.weeklyMineralsByType[tag] ?? 0;
  }
  if (isVitaminTargetTag(tag)) {
    return context.weeklyVitaminsByType[tag] ?? 0;
  }
  return context.weeklyPolyphenolByType[tag] ?? 0;
};

const getAllTipTargets = (tip: any): PlanTarget[] => {
  const fiberTargets = tip.fiberTargets ?? [];
  const polyphenolTargets = tip.polyphenolTargets ?? [];
  const mineralTargets = tip.mineralTargets ?? [];
  const vitaminTargets = tip.vitaminTargets ?? [];
  const aminoAcidTargets = tip.aminoAcidTargets ?? [];
  const trackingTargets = tip.trackingTargets ?? [];

  return [
    ...fiberTargets,
    ...polyphenolTargets,
    ...mineralTargets,
    ...vitaminTargets,
    ...aminoAcidTargets,
    ...trackingTargets,
  ];
};

const normalizeTrackedItems = (
  value: WeeklyTrackingSignalValue | undefined
): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  return value
    .filter(item => item.length > 0)
    .sort((a, b) => a.localeCompare(b));
};

const buildTipTargetProgress = (
  target: PlanTarget,
  tipPeriod: NutritionTargetPeriod,
  context: NutritionPlanProgressContext
) => {
  const trackingKey = target.trackingKey ?? target.tag ?? '';
  const actual =
    tipPeriod === 'weekly'
      ? getWeeklyTargetValueFromContext(trackingKey, target.unit, context)
      : getDailyTargetValueFromContext(trackingKey, target.unit, context);
  const trackingValue =
    tipPeriod === 'weekly'
      ? context.weeklyTracking[context.weekStartKey]?.[trackingKey]
      : context.dailyTracking[trackingKey];
  const trackedItems = normalizeTrackedItems(trackingValue);
  const labelGroup = getTipLabelGroup(target.unit, trackingKey);

  return {
    tag: trackingKey,
    unit: target.unit,
    period: tipPeriod,
    amount: target.amount,
    actual,
    isMet: actual >= target.amount,
    label: context.t(`nutritionLogger.${labelGroup}.${trackingKey}`),
    trackedItems,
  };
};

const buildTipProgressFromPlanTip = (
  planTip: PlanTip,
  context: NutritionPlanProgressContext
): TipProgressItem[] => {
  const tip = tips.find(candidate => candidate.id === planTip.tipId);
  if (!tip) return [];

  const tipPeriod = tip.targetPeriod;
  const allTargets = getAllTipTargets(tip);
  if (!tipPeriod || !allTargets.length) return [];

  const targets = allTargets.map(target => buildTipTargetProgress(target, tipPeriod, context));
  const metCount = targets.reduce((count, target) => count + (target.isMet ? 1 : 0), 0);
  const totalCount = targets.length;

  return [
    {
      tipId: tip.id,
      title: tip.title,
      areaId: tip.areas[0]?.id,
      period: tipPeriod,
      targets,
      metCount,
      totalCount,
      isFulfilled: metCount === totalCount,
      progress: totalCount > 0 ? metCount / totalCount : 0,
    },
  ];
};

export const buildNutritionPlanTipProgress = (
  context: NutritionPlanProgressContext
): TipProgressItem[] => {
  return (context.plans?.nutrition ?? []).flatMap((planTip: PlanTip) =>
    buildTipProgressFromPlanTip(planTip, context)
  );
};
