import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { MealEntry, NutritionData, NutritionEntry } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import type { MicrobiomeSupportEntry } from '@/types/microbiome';
import type { ConfidenceLevel } from '@/utils/analyzeNutrition';
import { parseNumberValue } from '@/utils/analyzeNutrition';

const RECENT_MEAL_LIMIT = 20;

const sumTypedTotals = (
  entries: NutritionEntry[],
  key: 'fiberByType' | 'fiberSubtypeTotals' | 'polyphenolByType' | 'mineralsByType' | 'vitaminsByType' | 'aminoAcidsByType'
) =>
  entries.reduce(
    (acc, entry) => {
      const rawValue = entry[key];
      const source = typeof rawValue === 'object' && rawValue !== null ? rawValue : {};
      for (const [tag, value] of Object.entries(source)) {
        const parsed = parseNumberValue(value);
        if (parsed === null) continue;
        acc[tag] = (acc[tag] ?? 0) + parsed;
      }
      return acc;
    },
    {} as Record<string, number>
  );

const sumMicrobiomeSupport = (entries: NutritionEntry[]): MicrobiomeSupportEntry[] => {
  const allEntries = entries.flatMap(entry => (Array.isArray(entry.microbiomeSupport) ? entry.microbiomeSupport : []));
  const byMicrobe = new Map<string, MicrobiomeSupportEntry>();
  allEntries.forEach(entry => {
    const key = entry.microbe.toLowerCase().trim();
    if (!key) return;
    const existing = byMicrobe.get(key);
    if (!existing) {
      byMicrobe.set(key, {
        microbe: entry.microbe,
        supportLevel: entry.supportLevel,
        linkedNutrients: Array.from(new Set(entry.linkedNutrients)),
        likelyFoods: Array.from(new Set(entry.likelyFoods)),
        rationale: entry.rationale,
      });
      return;
    }
    const supportLevelScore = (value: MicrobiomeSupportEntry['supportLevel']): number => {
      if (value === 'high') return 3;
      if (value === 'medium') return 2;
      if (value === 'low') return 1;
      return 0;
    };
    const nextLevel = supportLevelScore(entry.supportLevel) > supportLevelScore(existing.supportLevel) ? entry.supportLevel : existing.supportLevel;
    byMicrobe.set(key, {
      microbe: existing.microbe,
      supportLevel: nextLevel,
      linkedNutrients: Array.from(new Set([...existing.linkedNutrients, ...entry.linkedNutrients])),
      likelyFoods: Array.from(new Set([...existing.likelyFoods, ...entry.likelyFoods])),
      rationale: existing.rationale ?? entry.rationale,
    });
  });
  return Array.from(byMicrobe.values());
};

const mergeMineralConfidenceFromEntries = (entries: NutritionEntry[]): Record<string, ConfidenceLevel> => {
  const totals: Record<string, ConfidenceLevel> = MINERAL_TYPE_KEYS.reduce(
    (acc, key) => ({
      ...acc,
      [key]: 'unknown' as ConfidenceLevel,
    }),
    {} as Record<string, ConfidenceLevel>
  );
  const confidenceRank: Record<ConfidenceLevel, number> = {
    unknown: 0,
    low: 1,
    medium: 2,
    high: 3,
  };
  entries.forEach(entry => {
    const raw = entry.mineralsConfidenceByType;
    if (!raw) return;
    MINERAL_TYPE_KEYS.forEach(key => {
      const value = raw[key];
      if (value === 'high' || value === 'medium' || value === 'low' || value === 'unknown') {
        if (confidenceRank[value] > confidenceRank[totals[key]]) {
          totals[key] = value;
        }
      }
    });
  });
  return totals;
};

export const useNutritionLoggerData = (selectedDate: string) => {
  const { t } = useTranslation();
  const { dailyNutritionTracking, dailyDrinkTracking } = useStorage();

  const summary = dailyNutritionTracking[selectedDate];
  const drinks = dailyDrinkTracking[selectedDate] ?? [];

  const recentMeals = useMemo<MealEntry[]>(() => {
    const meals: MealEntry[] = [];
    const dateKeys = Object.keys(dailyNutritionTracking).sort((a, b) => b.localeCompare(a));

    for (const dateKey of dateKeys) {
      const entries = dailyNutritionTracking[dateKey]?.entries ?? [];
      const dayMeals = entries
        .filter((entry): entry is MealEntry => entry.type === 'meal')
        .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

      meals.push(...dayMeals);

      if (meals.length >= RECENT_MEAL_LIMIT) {
        return meals.slice(0, RECENT_MEAL_LIMIT);
      }
    }

    return meals;
  }, [dailyNutritionTracking]);

  const dailyNutrition = useMemo<NutritionData>(() => {
    const entries = summary?.entries ?? [];
    return {
      name: t('nutritionLogger.dailySummary'),
      calories: summary?.totals.calories,
      protein: summary?.totals.protein,
      carbohydrates: summary?.totals.carbohydrates,
      fat: summary?.totals.fat,
      fiber: summary?.totals.fiber,
      fiberByType: sumTypedTotals(entries, 'fiberByType'),
      fiberSubtypeTotals: sumTypedTotals(entries, 'fiberSubtypeTotals'),
      polyphenolByType: sumTypedTotals(entries, 'polyphenolByType'),
      mineralsByType: sumTypedTotals(entries, 'mineralsByType'),
      mineralsConfidenceByType: summary ? mergeMineralConfidenceFromEntries(entries) : {},
      vitaminsByType: sumTypedTotals(entries, 'vitaminsByType'),
      aminoAcidsByType: sumTypedTotals(entries, 'aminoAcidsByType'),
      microbiomeSupport: summary ? sumMicrobiomeSupport(entries) : [],
    };
  }, [summary, t]);

  return { summary, drinks, recentMeals, dailyNutrition };
};
