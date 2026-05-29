import { TFunction } from 'i18next';

import { PlanTipEntry } from '@/app/context/StorageContext';
import { type SupplementTime } from '@/app/domain/SupplementTime';
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


export type WeeklyTrackingItem = { en: string; local: string };

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
  supplementIds?: string[];
};

export type NutritionPlanProgressContext = {
  plans: any;
  summary: any;
  t: TFunction;
  selectedDateKey: string;
  weekStartKey: string;
  dailyTracking: WeeklyTrackingSignals;
  weeklyTracking: Record<string, WeeklyTrackingSignals>;
  takenDates: Record<string, SupplementTime[]>;
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
    if (Array.isArray(value)) {
      // Hantera både string[] och { en, local }[]
      const arr = value as Array<any>;
      const ens = arr.map(item =>
        typeof item === 'object' && item && typeof item.en === 'string' ? item.en : typeof item === 'string' ? item : ''
      ).filter(Boolean);
      const deduped = Array.from(new Set(ens));
      return deduped.length;
    }
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

const normalizeSupplementKey = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase();

const parseDateKeyLocal = (dateKey: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  return new Date(year, month - 1, day);
};

const toDateKeyLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekEndFromStartKey = (weekStartKey: string): string => {
  const weekStartDate = parseDateKeyLocal(weekStartKey);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  return toDateKeyLocal(weekEndDate);
};

const parseQuantity = (value: string | undefined): number | null => {
  const parsed = Number.parseFloat((value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeUnit = (value: string | undefined): string =>
  (value ?? '').trim().toLowerCase();

const toMilligrams = (quantity: number, unit: string): number | null => {
  if (unit === 'mg') return quantity;
  if (unit === 'g') return quantity * 1000;
  if (unit === 'mcg' || unit === 'ug' || unit === 'μg') return quantity / 1000;
  return null;
};

const toGrams = (quantity: number, unit: string): number | null => {
  if (unit === 'g') return quantity;
  if (unit === 'mg') return quantity / 1000;
  if (unit === 'mcg' || unit === 'ug' || unit === 'μg') return quantity / 1_000_000;
  return null;
};

type MatchedSupplement = {
  id?: string;
  name?: string;
  quantity?: string;
  unit?: string;
};

const getMatchedSupplementsForTarget = (
  tip: any,
  target: PlanTarget,
  tipPeriod: NutritionTargetPeriod,
  context: NutritionPlanProgressContext
): MatchedSupplement[] => {
  const tipSupplementIds = (tip?.supplements ?? [])
    .map((entry: { id?: string }) => normalizeSupplementKey(entry.id))
    .filter(Boolean);

  const explicitTargetSupplementIds = (target.supplementIds ?? [])
    .map(id => normalizeSupplementKey(id))
    .filter(Boolean);

  const matchedSupplementIds =
    explicitTargetSupplementIds.length > 0 ? explicitTargetSupplementIds : tipSupplementIds;

  if (!matchedSupplementIds.length) {
    return [];
  }

  const matchedSet = new Set(matchedSupplementIds);
  const weekEndKey = getWeekEndFromStartKey(context.weekStartKey);
  const dateEntries = Object.entries(context.takenDates ?? {}).filter(([dateKey]) =>
    tipPeriod === 'weekly'
      ? dateKey >= context.weekStartKey && dateKey <= weekEndKey
      : dateKey === context.selectedDateKey
  );

  const matchedSupplements: MatchedSupplement[] = [];
  dateEntries.forEach(([, supplements]) => {
    (supplements ?? []).forEach(entry => {
      const idKey = normalizeSupplementKey(entry.id);
      const nameKey = normalizeSupplementKey(entry.name);
      if (matchedSet.has(idKey) || matchedSet.has(nameKey)) {
        matchedSupplements.push(entry);
      }
    });
  });

  return matchedSupplements;
};

const getSupplementContributionForTarget = (
  supplements: MatchedSupplement[],
  unit: NutritionTargetUnit
): { value: number; names: string[] } => {
  if (unit !== 'mg' && unit !== 'g') {
    return { value: 0, names: [] };
  }

  let sum = 0;
  const names: string[] = [];
  supplements.forEach(item => {
    const quantity = parseQuantity(item.quantity);
    if (quantity === null) return;
    const sourceUnit = normalizeUnit(item.unit);
    const converted = unit === 'mg' ? toMilligrams(quantity, sourceUnit) : toGrams(quantity, sourceUnit);
    if (converted === null) return;
    sum += converted;
    names.push(item.name || item.id || 'supplement');
  });

  return { value: sum, names };
};

const normalizeTrackedItems = (
  value: WeeklyTrackingSignalValue | undefined
): WeeklyTrackingItem[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  // Hantera { en, local }[] eller string[] (legacy)
  const arr = value as Array<any>;
  const items: WeeklyTrackingItem[] = arr
    .map(item => {
      if (typeof item === 'object' && item && typeof item.en === 'string' && typeof item.local === 'string') {
        return { en: item.en.trim(), local: item.local.trim() };
      } else if (typeof item === 'string') {
        return { en: item.trim(), local: item.trim() };
      }
      return null;
    })
    .filter((item): item is WeeklyTrackingItem => !!item && item.en.length > 0 && item.local.length > 0);
  // Deduplicera på en-fältet
  const deduped = Array.from(new Map(items.map(i => [i.en, i])).values());
  return deduped.length ? deduped : undefined;
};

const buildTipTargetProgress = (
  target: PlanTarget,
  tip: any,
  tipPeriod: NutritionTargetPeriod,
  context: NutritionPlanProgressContext
) => {
  const trackingKey = target.trackingKey ?? target.tag ?? '';
  const baseActual =
    tipPeriod === 'weekly'
      ? getWeeklyTargetValueFromContext(trackingKey, target.unit, context)
      : getDailyTargetValueFromContext(trackingKey, target.unit, context);
  const matchedSupplements = getMatchedSupplementsForTarget(tip, target, tipPeriod, context);
  const supplementContribution = getSupplementContributionForTarget(matchedSupplements, target.unit);
  const actual = baseActual + supplementContribution.value;
  const labelGroup = getTipLabelGroup(target.unit, trackingKey);

  // Only discrete/weekly targets use trackedItems and logging
  let trackedItems: WeeklyTrackingItem[] | undefined;
  let trackingValue: any;
  if (target.unit === 'items' || target.unit === 'count' || target.unit === 'plants') {
    const weekObj = context.weeklyTracking[context.weekStartKey] ?? {};
    // Extra debug: log weekStartKey and all weeklyTracking keys
    try {
      console.log('[buildTipTargetProgress] weekStartKey:', context.weekStartKey);
      console.log('[buildTipTargetProgress] all weeklyTracking keys:', Object.keys(context.weeklyTracking));
      console.log('[buildTipTargetProgress] weeklyTracking[weekStartKey]:', weekObj);
    } catch (e) {}
    trackingValue = tipPeriod === 'weekly'
      ? weekObj[trackingKey]
      : context.dailyTracking[trackingKey];
    trackedItems = normalizeTrackedItems(trackingValue) ?? [];
    // DEBUG LOGGING
    try {
      console.log('[buildTipTargetProgress] trackingKey:', trackingKey);
      console.log('[buildTipTargetProgress] available weeklyTracking keys:', Object.keys(weekObj));
      console.log('[buildTipTargetProgress] trackingValue:', trackingValue);
      console.log('[buildTipTargetProgress] trackedItems:', trackedItems);
    } catch (e) {
      console.log('[buildTipTargetProgress] Log error:', e);
    }
  }

  return {
    tag: trackingKey,
    unit: target.unit,
    period: tipPeriod,
    amount: target.amount,
    actual,
    foodActual: baseActual,
    supplementActual: supplementContribution.value,
    isMet: actual >= target.amount,
    label: context.t(`nutritionLogger.${labelGroup}.${trackingKey}`),
    trackedItems: trackedItems && trackedItems.length ? trackedItems : undefined,
    supplementIds: target.supplementIds,
  };
};

const buildTipProgressFromPlanTip = (
  planTip: PlanTipEntry,
  context: NutritionPlanProgressContext
): TipProgressItem[] => {
  const tip = tips.find(candidate => candidate.id === planTip.tipId);
  if (!tip) return [];

  const tipPeriod = tip.targetPeriod;
  const allTargets = getAllTipTargets(tip);
  if (!tipPeriod || !allTargets.length) return [];

  // Deduplicate targets by trackingKey/unit/period
  const seen = new Set<string>();
  const dedupedTargets = allTargets.filter(target => {
    const key = `${target.trackingKey ?? target.tag ?? ''}|${target.unit}|${tipPeriod}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const targets = dedupedTargets.map(target => buildTipTargetProgress(target, tip, tipPeriod, context));
  const metCount = targets.reduce((count, target) => count + (target.isMet ? 1 : 0), 0);
  const totalCount = targets.length;

  return [
    {
      tipId: tip.id,
      title: tip.title,
      areaId: tip.areas[0]?.id,
      dateKey: context.selectedDateKey,
      startedAt: planTip.startedAt,
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
  // Collect all tips' progress items
  const allTipProgress = (context.plans?.nutrition ?? []).flatMap((planTip: PlanTipEntry) =>
    buildTipProgressFromPlanTip(planTip, context)
  );

  // Deduplicate targets globally by trackingKey/unit/period
  const seen = new Set<string>();
  const deduped: TipProgressItem[] = [];
  for (const tipProgress of allTipProgress) {
    const uniqueTargets = [];
    for (const target of tipProgress.targets) {
      const key = `${target.tag}|${target.unit}|${target.period}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueTargets.push(target);
    }
    if (uniqueTargets.length) {
      deduped.push({ ...tipProgress, targets: uniqueTargets, totalCount: uniqueTargets.length, metCount: uniqueTargets.filter(t => t.isMet).length, isFulfilled: uniqueTargets.every(t => t.isMet), progress: uniqueTargets.length > 0 ? uniqueTargets.filter(t => t.isMet).length / uniqueTargets.length : 0 });
    }
  }
  return deduped;
};
