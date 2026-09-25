import { roundToOneDecimal } from '@/utils/analyzeNutrition';

import { getDailyRange, getTrackingKeys, removeDailyValue, saveDailyValue } from '../shared/trackingStorage';
import type { DailyNutritionSummary, DailyNutritionTracking, NutritionEntry, NutritionTrackingContribution, WeeklyNutritionTracking } from './nutritionTypes';

const DAILY_NUTRITION_NAMESPACE = 'dailyNutritionTracking';
const WEEKLY_NUTRITION_NAMESPACE = 'weeklyNutritionTracking';

export type NutritionStorage = {
  dailyNutritionTracking: DailyNutritionTracking;
  weeklyNutritionTracking: WeeklyNutritionTracking;
};

// Private

const buildDailyNutritionSummary = (entries: NutritionEntry[], dateKey: string): DailyNutritionSummary => {
  const rawTotals = entries.reduce(
    (acc, entry) => ({
      protein: acc.protein + (entry.protein ?? 0),
      calories: acc.calories + (entry.calories ?? 0),
      carbohydrates: acc.carbohydrates + (entry.carbohydrates ?? 0),
      fat: acc.fat + (entry.fat ?? 0),
      fiber: acc.fiber + (entry.fiber ?? 0),
    }),
    {
      protein: 0,
      calories: 0,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
    }
  );

  const totals = {
    protein: roundToOneDecimal(rawTotals.protein),
    calories: roundToOneDecimal(rawTotals.calories),
    carbohydrates: roundToOneDecimal(rawTotals.carbohydrates),
    fat: roundToOneDecimal(rawTotals.fat),
    fiber: roundToOneDecimal(rawTotals.fiber),
  };

  return {
    date: dateKey,
    entries,
    totals,
    goalsMet: {
      protein: totals.protein >= 100,
      calories: totals.calories >= 2000,
      carbohydrates: totals.carbohydrates >= 250,
      fat: totals.fat >= 70,
      fiber: totals.fiber >= 25,
    },
  };
};

const saveDailyNutritionTracking = (dateKey: string, summary: DailyNutritionSummary): Promise<void> =>
  saveDailyValue(DAILY_NUTRITION_NAMESPACE, dateKey, summary);

const removeDailyNutritionTracking = (dateKey: string): Promise<void> => removeDailyValue(DAILY_NUTRITION_NAMESPACE, dateKey);

const getAllDailyNutritionTracking = async (): Promise<DailyNutritionTracking> => {
  const dateKeys = await getTrackingKeys(DAILY_NUTRITION_NAMESPACE);

  return getDailyRange<DailyNutritionSummary>(DAILY_NUTRITION_NAMESPACE, dateKeys);
};

// Public

export const syncDailyNutritionTracking = (previous: DailyNutritionTracking, updated: DailyNutritionTracking): void => {
  const dateKeys = new Set([...Object.keys(previous), ...Object.keys(updated)]);

  dateKeys.forEach(dateKey => {
    const previousSummary = previous[dateKey];
    const updatedSummary = updated[dateKey];

    if (previousSummary === updatedSummary) {
      return;
    }

    if (!updatedSummary) {
      removeDailyNutritionTracking(dateKey).catch(error => {
        console.error(`Failed to remove nutrition for ${dateKey}`, error);
      });
      return;
    }

    saveDailyNutritionTracking(dateKey, updatedSummary).catch(error => {
      console.error(`Failed to save nutrition for ${dateKey}`, error);
    });
  });
};

export const addNutritionEntryToTracking = (tracking: DailyNutritionTracking, dateKey: string, entry: NutritionEntry): DailyNutritionTracking => ({
  ...tracking,
  [dateKey]: buildDailyNutritionSummary([...(tracking[dateKey]?.entries ?? []), entry], dateKey),
});

export const updateNutritionEntryInTracking = (
  tracking: DailyNutritionTracking,
  dateKey: string,
  entryId: string,
  updates: Partial<NutritionEntry>
): DailyNutritionTracking => {
  const summary = tracking[dateKey];

  if (!summary) {
    return tracking;
  }

  const entries = summary.entries.map(entry => (entry.id === entryId ? { ...entry, ...updates } : entry));

  return {
    ...tracking,
    [dateKey]: buildDailyNutritionSummary(entries, dateKey),
  };
};

export const removeNutritionEntryFromTracking = (tracking: DailyNutritionTracking, dateKey: string, entryId: string): DailyNutritionTracking => {
  const summary = tracking[dateKey];

  if (!summary) {
    return tracking;
  }

  const entries = summary.entries.filter(entry => entry.id !== entryId);

  const updated = { ...tracking };

  if (entries.length === 0) {
    delete updated[dateKey];
  } else {
    updated[dateKey] = buildDailyNutritionSummary(entries, dateKey);
  }

  return updated;
};

export const getRecentDailyNutritionTracking = async (dayLimit: number): Promise<DailyNutritionTracking> => {
  const dateKeys = await getTrackingKeys(DAILY_NUTRITION_NAMESPACE);

  const recentDateKeys = dateKeys.slice(Math.max(0, dateKeys.length - dayLimit));

  return getDailyRange<DailyNutritionSummary>(DAILY_NUTRITION_NAMESPACE, recentDateKeys);
};

export const saveWeeklyNutritionTracking = (weekKey: string, contributions: NutritionTrackingContribution[]): Promise<void> =>
  saveDailyValue(WEEKLY_NUTRITION_NAMESPACE, weekKey, contributions);

export const removeWeeklyNutritionTracking = (weekKey: string): Promise<void> => removeDailyValue(WEEKLY_NUTRITION_NAMESPACE, weekKey);

export const getWeeklyNutritionTracking = async (): Promise<WeeklyNutritionTracking> => {
  const weekKeys = await getTrackingKeys(WEEKLY_NUTRITION_NAMESPACE);

  return getDailyRange<NutritionTrackingContribution[]>(WEEKLY_NUTRITION_NAMESPACE, weekKeys);
};

export const getNutritionStorage = async (): Promise<NutritionStorage> => {
  const [dailyNutritionTracking, weeklyNutritionTracking] = await Promise.all([getAllDailyNutritionTracking(), getWeeklyNutritionTracking()]);

  return {
    dailyNutritionTracking,
    weeklyNutritionTracking,
  };
};
