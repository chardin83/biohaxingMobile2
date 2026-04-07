import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { t as i18nT } from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import {
  XP_FOR_NUTRITION_TIP_DAILY_COMPLETION,
  XP_FOR_NUTRITION_TIP_WEEKLY_COMPLETION,
} from '@/constants/XP';
import { FIBER_CATEGORY_SUBTYPES, type FiberSubtype,tips } from '@/locales/tips';
import { NutritionAnalyze } from '@/services/gptServices';

import { Collapsible } from './Collapsible';
import ImagePickerButton from './ImagePickerButton';
import { ThemedModal } from './ThemedModal';
import { ThemedText } from './ThemedText';
import { Card } from './ui/Card';
import { IconSymbol } from './ui/IconSymbol';
import LabeledInput from './ui/LabeledInput';
import { SwipeableRow } from './ui/SwipeableRow';

interface NutritionLoggerProps {
  selectedDate: string;
}

type NutritionEvidence = {
  sources: string[];
  inferred: string[];
  confidence: 'high' | 'medium' | 'low' | 'unknown';
};

type MicrobiomeSupportEntry = {
  microbe: string;
  supportLevel: 'high' | 'medium' | 'low' | 'unknown';
  linkedNutrients: string[];
  likelyFoods: string[];
  rationale?: string;
};

type WeeklyTrackingSignalValue = string[] | number;
type WeeklyTrackingSignals = Record<string, WeeklyTrackingSignalValue>;

const parseStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }
  return [];
};

const normalizeConfidence = (value: unknown): NutritionEvidence['confidence'] => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const normalizedScore = value > 1 && value <= 100 ? value / 100 : value;
    if (normalizedScore >= 0.8) return 'high';
    if (normalizedScore >= 0.5) return 'medium';
    if (normalizedScore > 0) return 'low';
    return 'unknown';
  }
  if (typeof value !== 'string') return 'unknown';
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium')) return 'medium';
  if (normalized.includes('low')) return 'low';
  return 'unknown';
};

const pickConfidence = (labelValue: unknown, scoreValue: unknown): NutritionEvidence['confidence'] => {
  const label = normalizeConfidence(labelValue);
  if (label === 'unknown') {
    return normalizeConfidence(scoreValue);
  }
  return label;
};

const extractEvidence = (data: any, parsedContent: any): NutritionEvidence => {
  const fromNutrition = data?.nutrition ?? {};
  const fromRaw = data?.raw ?? {};
  const fromParsed = parsedContent ?? {};

  const sources = [
    ...parseStringArray(fromNutrition.sources),
    ...parseStringArray(fromRaw.sources),
    ...parseStringArray(fromParsed.sources),
    ...parseStringArray(data?.sources),
    ...parseStringArray(fromNutrition.foodSources),
    ...parseStringArray(fromRaw.foodSources),
    ...parseStringArray(fromParsed.foodSources),
    ...parseStringArray(data?.foodSources),
    ...parseStringArray(fromNutrition.food_sources),
    ...parseStringArray(fromRaw.food_sources),
    ...parseStringArray(fromParsed.food_sources),
    ...parseStringArray(data?.food_sources),
    ...parseStringArray(fromNutrition.referenceSources),
    ...parseStringArray(fromRaw.referenceSources),
    ...parseStringArray(fromParsed.referenceSources),
    ...parseStringArray(data?.referenceSources),
    ...parseStringArray(fromNutrition.reference_sources),
    ...parseStringArray(fromRaw.reference_sources),
    ...parseStringArray(fromParsed.reference_sources),
    ...parseStringArray(data?.reference_sources),
  ];

  const inferred = [
    ...parseStringArray(fromNutrition.inferred),
    ...parseStringArray(fromRaw.inferred),
    ...parseStringArray(fromParsed.inferred),
    ...parseStringArray(data?.inferred),
    ...parseStringArray(fromNutrition.aiAssumptions),
    ...parseStringArray(fromRaw.aiAssumptions),
    ...parseStringArray(fromParsed.aiAssumptions),
    ...parseStringArray(data?.aiAssumptions),
    ...parseStringArray(fromNutrition.ai_assumptions),
    ...parseStringArray(fromRaw.ai_assumptions),
    ...parseStringArray(fromParsed.ai_assumptions),
    ...parseStringArray(data?.ai_assumptions),
  ];

  const nutritionConfidence = pickConfidence(fromNutrition.confidenceLabel, fromNutrition.confidence);
  const rawConfidence = pickConfidence(fromRaw.confidenceLabel, fromRaw.confidence);
  const parsedConfidence = pickConfidence(fromParsed.confidenceLabel, fromParsed.confidence);
  const rootConfidence = pickConfidence(data?.confidenceLabel, data?.confidence);

  let confidence: NutritionEvidence['confidence'] = 'unknown';
  if (nutritionConfidence === 'high' || nutritionConfidence === 'medium' || nutritionConfidence === 'low') {
    confidence = nutritionConfidence;
  } else if (rawConfidence === 'high' || rawConfidence === 'medium' || rawConfidence === 'low') {
    confidence = rawConfidence;
  } else if (parsedConfidence === 'high' || parsedConfidence === 'medium' || parsedConfidence === 'low') {
    confidence = parsedConfidence;
  } else if (rootConfidence === 'high' || rootConfidence === 'medium' || rootConfidence === 'low') {
    confidence = rootConfidence;
  }

  return {
    sources: Array.from(new Set(sources)),
    inferred: Array.from(new Set(inferred)),
    confidence,
  };
};

const buildEvidenceMessage = (evidence: NutritionEvidence): string => {
  let confidenceLabel = 'Confidence okand';
  if (evidence.confidence === 'high') {
    confidenceLabel = 'Hog confidence';
  } else if (evidence.confidence === 'medium') {
    confidenceLabel = 'Medium confidence';
  } else if (evidence.confidence === 'low') {
    confidenceLabel = 'Lag confidence';
  }

  const sourceLine = evidence.sources.length
    ? `Source-backed: ${evidence.sources.join(', ')}`
    : 'Source-backed: inga explicita kallor angavs';

  const inferredLine = evidence.inferred.length
    ? `AI-inferred: ${evidence.inferred.join(', ')}`
    : 'AI-inferred: inga extra inferenser angavs';

  return `${confidenceLabel}\n${sourceLine}\n${inferredLine}`;
};

type ParsedMacroAnalysis = {
  mealName: string;
  protein: number;
  calories: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  fiberByType: Record<string, number>;
  fiberSubtypeTotals: Record<string, number>;
  polyphenolByType: Record<string, number>;
  microbiomeSupport: MicrobiomeSupportEntry[];
};

const FIBER_TYPE_KEYS = ['fiber_total', 'fiber_gel_forming', 'fiber_non_gel_forming', 'fiber_fermentable'] as const;
const POLYPHENOL_TYPE_KEYS = [
  'polyphenols_total',
  'flavonoids_total',
  'flavonoids',
  'anthocyanins',
  'catechins',
  'flavanols',
  'flavonols',
  'quercetin',
  'ellagitannins',
] as const;

type FiberTypeKey = (typeof FIBER_TYPE_KEYS)[number];
type FiberSubtypeKey = FiberSubtype;
type PolyphenolTypeKey = (typeof POLYPHENOL_TYPE_KEYS)[number];

const ALL_FIBER_SUBTYPES: FiberSubtypeKey[] = [
  ...new Set(Object.values(FIBER_CATEGORY_SUBTYPES).flat()),
] as FiberSubtypeKey[];

const emptyFiberTotals = (): Record<string, number> =>
  FIBER_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const emptyFiberSubtypeTotals = (): Record<string, number> =>
  ALL_FIBER_SUBTYPES.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const emptyPolyphenolTotals = (): Record<string, number> =>
  POLYPHENOL_TYPE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<string, number>);

const addToTotals = (target: Record<string, number>, key: string, value: unknown) => {
  const parsed = parseNumberValue(value);
  if (parsed === null) return;
  if (!Number.isFinite(parsed)) return;
  target[key] = (target[key] ?? 0) + parsed;
};

const supportLevelScore = (value: MicrobiomeSupportEntry['supportLevel']): number => {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  if (value === 'low') return 1;
  return 0;
};

const normalizeSupportLevel = (value: unknown): MicrobiomeSupportEntry['supportLevel'] => {
  if (typeof value !== 'string') return 'unknown';
  const raw = value.toLowerCase().trim();
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  return 'unknown';
};

const mergeMicrobiomeSupportLists = (entries: MicrobiomeSupportEntry[]): MicrobiomeSupportEntry[] => {
  const byMicrobe = new Map<string, MicrobiomeSupportEntry>();

  entries.forEach(entry => {
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

    const nextLevel = supportLevelScore(entry.supportLevel) > supportLevelScore(existing.supportLevel)
      ? entry.supportLevel
      : existing.supportLevel;

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

const extractMicrobiomeSupport = (data: any, parsedContent: any): MicrobiomeSupportEntry[] => {
  const candidates = [
    data,
    data?.nutrition,
    data?.raw,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
  ];

  const entries: MicrobiomeSupportEntry[] = [];

  candidates.forEach(candidate => {
    const fromDetails = Array.isArray(candidate?.nutritionDetails?.microbiomeSupport)
      ? candidate.nutritionDetails.microbiomeSupport
      : [];
    const fromRoot = Array.isArray(candidate?.microbiomeSupport) ? candidate.microbiomeSupport : [];
    const merged = [...fromDetails, ...fromRoot];

    merged.forEach((item: any) => {
      const microbe = String(item?.microbe ?? '').trim();
      if (!microbe) return;

      entries.push({
        microbe,
        supportLevel: normalizeSupportLevel(item?.supportLevel ?? item?.support_level),
        linkedNutrients: parseStringArray(item?.linkedNutrients ?? item?.linked_nutrients),
        likelyFoods: parseStringArray(item?.likelyFoods ?? item?.likely_foods),
        rationale: typeof item?.rationale === 'string' ? item.rationale : undefined,
      });
    });
  });

  return mergeMicrobiomeSupportLists(entries);
};

const normalizeFlavonoidClassTag = (value: unknown): PolyphenolTypeKey | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('anthocyan')) return 'anthocyanins';
  if (normalized.includes('catechin')) return 'catechins';
  if (normalized.includes('flavanol')) return 'flavanols';
  if (normalized.includes('flavonol')) return 'flavonols';
  if (normalized.includes('quercetin')) return 'quercetin';
  if (normalized.includes('ellagitannin')) return 'ellagitannins';
  if (normalized.includes('flavonoid')) return 'flavonoids';
  return null;
};

const applyMeasuredByTypeFromCandidate = (
  candidate: any,
  fiberByType: Record<string, number>,
  fiberSubtypeTotals: Record<string, number>,
  polyphenolByType: Record<string, number>
) => {
  const fiberMap = candidate?.fiberByType;
  const fiberSubtypeMap = candidate?.fiberSubtypeTotals;
  const polyMap = candidate?.polyphenolByType;

  if (fiberMap && typeof fiberMap === 'object') {
    FIBER_TYPE_KEYS.forEach(tag => addToTotals(fiberByType, tag, fiberMap?.[tag]));
  }

  if (fiberSubtypeMap && typeof fiberSubtypeMap === 'object') {
    ALL_FIBER_SUBTYPES.forEach(tag => addToTotals(fiberSubtypeTotals, tag, fiberSubtypeMap?.[tag]));
  }

  if (polyMap && typeof polyMap === 'object') {
    POLYPHENOL_TYPE_KEYS.forEach(tag => addToTotals(polyphenolByType, tag, polyMap?.[tag]));
  }
};

const applyDetailsFromCandidate = (
  candidate: any,
  fiberByType: Record<string, number>,
  fiberSubtypeTotals: Record<string, number>,
  polyphenolByType: Record<string, number>
) => {
  const details = candidate?.nutritionDetails;
  const fiberDetails = details?.fiber;
  if (fiberDetails) {
    addToTotals(fiberByType, 'fiber_total', fiberDetails?.total);
    addToTotals(fiberByType, 'fiber_gel_forming', fiberDetails?.gelForming ?? fiberDetails?.gel_forming ?? fiberDetails?.soluble);
    addToTotals(fiberByType, 'fiber_non_gel_forming', fiberDetails?.nonGelForming ?? fiberDetails?.non_gel_forming ?? fiberDetails?.insoluble);
    addToTotals(fiberByType, 'fiber_fermentable', fiberDetails?.fermentable ?? fiberDetails?.resistantStarch ?? fiberDetails?.resistant_starch);

    const subtypeRows = Array.isArray(fiberDetails?.subtypes) ? fiberDetails.subtypes : [];
    subtypeRows.forEach((item: any) => {
      const subtype = String(item?.subtype ?? '').trim();
      if (!ALL_FIBER_SUBTYPES.includes(subtype as FiberSubtypeKey)) return;
      addToTotals(fiberSubtypeTotals, subtype, item?.amountG ?? item?.amount_g ?? item?.amount);
    });
  }

  const polyphenols = details?.polyphenols;
  if (polyphenols) {
    addToTotals(polyphenolByType, 'polyphenols_total', polyphenols?.totalMg ?? polyphenols?.total_mg);
  }

  const flavonoids = details?.flavonoids;
  if (!flavonoids) return;

  addToTotals(polyphenolByType, 'flavonoids_total', flavonoids?.totalMg ?? flavonoids?.total_mg);
  const classes = Array.isArray(flavonoids?.classes) ? flavonoids.classes : [];
  classes.forEach((item: any) => {
    const classTag = normalizeFlavonoidClassTag(item?.name);
    if (classTag) addToTotals(polyphenolByType, classTag, item?.amountMg ?? item?.amount_mg);
  });
};

const extractTypedTotals = (data: any, parsedContent: any) => {
  const fiberByType = emptyFiberTotals();
  const fiberSubtypeTotals = emptyFiberSubtypeTotals();
  const polyphenolByType = emptyPolyphenolTotals();

  const candidates = [
    data,
    data?.nutrition,
    data?.raw,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
  ];

  for (const candidate of candidates) {
    applyMeasuredByTypeFromCandidate(candidate, fiberByType, fiberSubtypeTotals, polyphenolByType);
    applyDetailsFromCandidate(candidate, fiberByType, fiberSubtypeTotals, polyphenolByType);
  }

  return { fiberByType, fiberSubtypeTotals, polyphenolByType };
};

const hasAnyTypedTotals = (values: Record<string, number>) =>
  Object.values(values).some(value => (value ?? 0) > 0);

const getFiberSubtypeAmountsForCategory = (
  category: FiberTypeKey,
  subtypeTotals: Record<string, number>
): Array<{ subtype: FiberSubtypeKey; label: string; amount: number }> => {
  if (category === 'fiber_total') return [];

  const subtypes = FIBER_CATEGORY_SUBTYPES[category] ?? [];
  return subtypes
    .map(subtype => ({
      subtype,
      label: i18nT(`nutritionLogger.fiberSubtypeLabels.${subtype}`),
      amount: subtypeTotals[subtype] ?? 0,
    }))
    .filter(item => item.amount > 0);
};

const sumTypedTotals = (meals: Array<any>, key: 'fiberByType' | 'fiberSubtypeTotals' | 'polyphenolByType') =>
  meals.reduce((acc, meal) => {
    const rawValue = meal?.[key];
    const source = typeof rawValue === 'object' && rawValue !== null ? rawValue : {};
    for (const [tag, value] of Object.entries(source)) {
      const parsed = parseNumberValue(value);
      if (parsed === null) continue;
      acc[tag] = (acc[tag] ?? 0) + parsed;
    }
    return acc;
  }, {} as Record<string, number>);

const sumMicrobiomeSupport = (meals: Array<any>): MicrobiomeSupportEntry[] => {
  const allEntries = meals.flatMap(meal =>
    Array.isArray(meal?.microbiomeSupport) ? meal.microbiomeSupport : []
  );
  return mergeMicrobiomeSupportLists(allEntries as MicrobiomeSupportEntry[]);
};

const formatTargetValue = (value: number, unit: 'g' | 'mg' | 'plants' | 'items' | 'count') => {
  if (unit === 'plants' || unit === 'items' || unit === 'count') {
    return `${Math.round(value)} ${unit}`;
  }
  const decimals = unit === 'g' ? 1 : 0;
  return `${value.toFixed(decimals)} ${unit}`;
};

const roundToOneDecimal = (value: number): number =>
  Math.round((value + Number.EPSILON) * 10) / 10;

const toDateKeyLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateKeyLocal = (dateKey: string): Date => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  return new Date(year, month - 1, day);
};

const getStartOfWeekMonday = (date: Date): Date => {
  const result = new Date(date);
  const dayOfWeek = result.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = (dayOfWeek + 6) % 7;
  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getWeekBoundsFromDateKey = (dateKey: string): { weekStartISO: string; weekEndISO: string } => {
  const date = parseDateKeyLocal(dateKey);
  const weekStartDate = getStartOfWeekMonday(date);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  return {
    weekStartISO: toDateKeyLocal(weekStartDate),
    weekEndISO: toDateKeyLocal(weekEndDate),
  };
};

const buildWeekTrackingFromSummaries = (
  summaries: Record<string, any>,
  weekStartISO: string,
  weekEndISO: string,
  allowedKeys: Set<string>
): Record<string, string[] | number> => {
  const aggregated: WeeklyTrackingSignals = {};

  Object.entries(summaries)
    .filter(([dateKey]) => dateKey >= weekStartISO && dateKey <= weekEndISO)
    .forEach(([, daySummary]) => {
      const meals = Array.isArray(daySummary?.meals) ? daySummary.meals : [];
      meals.forEach((meal: any) => {
        const mealSignals = extractWeeklyTrackingSignals(meal, undefined);
        Object.entries(mealSignals)
          .filter(([key]) => allowedKeys.has(key))
          .forEach(([key, value]) => {
            mergeWeeklyTrackingSignal(aggregated, key, value);
          });
      });
    });

  return aggregated;
};

const pruneFutureNutritionSummaries = (
  summaries: Record<string, any>,
  todayKey: string,
  protectedDateKey?: string
): { changed: boolean; next: Record<string, any> } => {
  let changed = false;
  const next: Record<string, any> = {};

  Object.entries(summaries).forEach(([dateKey, daySummary]) => {
    const keepDate = protectedDateKey && dateKey === protectedDateKey;

    if (dateKey > todayKey && !keepDate) {
      changed = true;
      return;
    }

    const meals = Array.isArray(daySummary?.meals) ? daySummary.meals : [];
    const safeMeals: any[] = [];

    meals.forEach((meal: any) => {
      const mealDate = typeof meal?.date === 'string' ? meal.date : dateKey;
      const keepMeal = protectedDateKey && mealDate === protectedDateKey;
      if (mealDate > todayKey && !keepMeal) {
        changed = true;
        return;
      }
      safeMeals.push(meal);
    });

    if (!safeMeals.length) {
      if (meals.length > 0 || daySummary) changed = true;
      return;
    }

    next[dateKey] = {
      ...daySummary,
      date: dateKey,
      meals: safeMeals,
    };
  });

  return { changed, next };
};

const parseNumberValue = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const normalized = value.replace(',', '.');
  const regex = /-?\d+(?:\.\d+)?/;
  const match = regex.exec(normalized);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
};

const pickFirstNumber = (candidate: any, keys: string[]): number | null => {
  if (!candidate || typeof candidate !== 'object') return null;
  for (const key of keys) {
    const parsed = parseNumberValue(candidate?.[key]);
    if (parsed !== null) return parsed;
  }
  return null;
};

const extractFromCandidate = (candidate: any): ParsedMacroAnalysis | null => {
  if (!candidate || typeof candidate !== 'object') return null;

  const protein = pickFirstNumber(candidate, ['protein', 'protein_g', 'proteinGrams', 'proteins']);
  const calories = pickFirstNumber(candidate, ['calories', 'kcal', 'energy_kcal', 'energy', 'kilocalories']);
  const carbohydrates = pickFirstNumber(candidate, ['carbohydrates', 'carbs', 'carbohydrate_g', 'carbs_g']);
  const fat = pickFirstNumber(candidate, ['fat', 'fats', 'fat_g', 'total_fat']);
  const fiber = pickFirstNumber(candidate, ['fiber', 'fibre', 'fiber_g', 'dietary_fiber']);

  if (protein === null && calories === null && carbohydrates === null && fat === null && fiber === null) {
    return null;
  }

  let mealNameRaw = '';
  if (typeof candidate?.mealName === 'string') {
    mealNameRaw = candidate.mealName;
  } else if (typeof candidate?.meal_name === 'string') {
    mealNameRaw = candidate.meal_name;
  } else if (typeof candidate?.name === 'string') {
    mealNameRaw = candidate.name;
  }
  const mealName = mealNameRaw.trim();

  return {
    mealName,
    protein: protein ?? 0,
    calories: calories ?? 0,
    carbohydrates: carbohydrates ?? 0,
    fat: fat ?? 0,
    fiber: fiber ?? 0,
    fiberByType: emptyFiberTotals(),
    fiberSubtypeTotals: emptyFiberSubtypeTotals(),
    polyphenolByType: emptyPolyphenolTotals(),
    microbiomeSupport: [],
  };
};

const extractFromText = (text: string): ParsedMacroAnalysis | null => {
  const read = (regex: RegExp): number | null => {
    const match = regex.exec(text);
    if (!match?.[1]) return null;
    return parseNumberValue(match[1]);
  };

  const protein = read(/protein[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const calories = read(/(?:kalorier|calories|kcal|energy)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const carbohydrates = read(/(?:kolhydrater|carbohydrates|carbs)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const fat = read(/(?:fett|fat)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  const fiber = read(/(?:fibrer|fiber|fibre)[^\d-]*(-?\d+(?:[.,]\d+)?)/i);

  if (protein === null && calories === null && carbohydrates === null && fat === null && fiber === null) {
    return null;
  }

  return {
    mealName: '',
    protein: protein ?? 0,
    calories: calories ?? 0,
    carbohydrates: carbohydrates ?? 0,
    fat: fat ?? 0,
    fiber: fiber ?? 0,
    fiberByType: emptyFiberTotals(),
    fiberSubtypeTotals: emptyFiberSubtypeTotals(),
    polyphenolByType: emptyPolyphenolTotals(),
    microbiomeSupport: [],
  };
};

const extractStructuredAnalysis = (data: any, parsedContent: any): ParsedMacroAnalysis | null => {
  const candidates = [
    data?.nutrition,
    data?.raw,
    data?.raw?.macros,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    data?.result?.raw?.macros,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
    parsedContent?.macros,
  ];

  for (const candidate of candidates) {
    const extracted = extractFromCandidate(candidate);
    if (extracted) return extracted;
  }

  if (typeof data?.content === 'string') {
    return extractFromText(data.content);
  }

  return null;
};

const mergeWeeklyTrackingSignal = (
  target: WeeklyTrackingSignals,
  key: string,
  value: unknown
) => {
  if (!key || typeof key !== 'string') return;

  if (Array.isArray(value)) {
    const nextItems = value
      .filter((item): item is string => typeof item === 'string')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    if (!nextItems.length) return;

    const existing = target[key];
    const existingItems = Array.isArray(existing) ? existing : [];
    target[key] = Array.from(new Set([...existingItems, ...nextItems]));
    return;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const existing = target[key];
    const existingNumber = typeof existing === 'number' ? existing : 0;
    target[key] = existingNumber + value;
  }
};

const extractWeeklyTrackingSignals = (data: any, parsedContent: any): WeeklyTrackingSignals => {
  const collected: WeeklyTrackingSignals = {};
  const candidates = [
    data,
    data?.nutrition,
    data?.raw,
    data?.result,
    data?.result?.nutrition,
    data?.result?.raw,
    parsedContent,
    parsedContent?.nutrition,
    parsedContent?.raw,
  ];

  candidates.forEach(candidate => {
    const fromObject = candidate?.weeklyTrackingSignals;
    if (fromObject && typeof fromObject === 'object' && !Array.isArray(fromObject)) {
      Object.entries(fromObject).forEach(([key, value]) => mergeWeeklyTrackingSignal(collected, key, value));
    }

    const fromRows = Array.isArray(candidate?.weeklyTrackingSignals)
      ? candidate.weeklyTrackingSignals
      : Array.isArray(candidate?.nutritionDetails?.weeklyTrackingSignals)
        ? candidate.nutritionDetails.weeklyTrackingSignals
        : [];

    fromRows.forEach((row: any) => {
      const key = String(row?.key ?? row?.trackingKey ?? '').trim();
      if (!key) return;

      if (Array.isArray(row?.items)) {
        mergeWeeklyTrackingSignal(collected, key, row.items);
      }

      const increment = parseNumberValue(row?.countIncrement ?? row?.increment ?? row?.count);
      if (increment !== null) {
        mergeWeeklyTrackingSignal(collected, key, increment);
      }
    });
  });

  return collected;
};


const NutritionLogger: React.FC<NutritionLoggerProps> = ({ selectedDate }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  
    
  const {
    dailyNutritionSummaries,
    setDailyNutritionSummaries,
    plans,
    weeklyTracking,
    setWeeklyTracking,
    addToWeeklyTracking,
    claimNutritionTipCompletionXP,
  } = useStorage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<string | null>(null);
  const [lastLoggedMeal, setLastLoggedMeal] = useState<ParsedMacroAnalysis | null>(null);
  const [selectedLoggedMealId, setSelectedLoggedMealId] = useState<string | null>(null);
  const [isEditMealModalVisible, setIsEditMealModalVisible] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealName, setEditingMealName] = useState('');

  const activeWeeklyTrackingTargetsForAI = useMemo(() => {
    const byKey = new Map<string, { key: string; unit: 'items' | 'count'; amount?: number; aiInstruction?: string }>();

    (plans?.nutrition ?? []).forEach(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);
      (tip?.weeklyTrackingTargets ?? []).forEach(target => {
        const key = target.trackingKey?.trim();
        if (!key) return;

        if (!byKey.has(key)) {
          byKey.set(key, {
            key,
            unit: target.unit,
            amount: target.amount,
            aiInstruction: target.aiInstruction,
          });
        }
      });
    });

    return Array.from(byKey.values());
  }, [plans]);

  const activeWeeklyTrackingKeys = useMemo(() => {
    const keys = new Set<string>();

    (plans?.nutrition ?? []).forEach(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);
      (tip?.weeklyTrackingTargets ?? []).forEach(target => {
        if (typeof target.trackingKey === 'string' && target.trackingKey.trim().length > 0) {
          keys.add(target.trackingKey.trim());
        }
      });
    });

    return keys;
  }, [plans]);

  const trackingPromptForAI = useMemo(() => {
    if (!activeWeeklyTrackingTargetsForAI.length) return 'nutrition_analysis';

    const targetsJson = JSON.stringify(activeWeeklyTrackingTargetsForAI);
    return [
      'nutrition_analysis',
      'weekly_tracking_targets_for_this_user:',
      targetsJson,
      'Only return weeklyTrackingSignals keys that exist in weekly_tracking_targets_for_this_user.',
      'For unit=items return items[]. For unit=count return countIncrement.',
    ].join('\n');
  }, [activeWeeklyTrackingTargetsForAI]);

  useEffect(() => {
    setLastLoggedMeal(null);
    setSelectedLoggedMealId(null);
    setIsEditMealModalVisible(false);
    setEditingMealId(null);
    setEditingMealName('');
  }, [selectedDate]);

  useEffect(() => {
    const todayKey = toDateKeyLocal(new Date());
    setDailyNutritionSummaries(prev => {
      const { changed, next } = pruneFutureNutritionSummaries(prev, todayKey, selectedDate);
      return changed ? next : prev;
    });
  }, [selectedDate, setDailyNutritionSummaries]);

  const buildDailySummary = (meals: Array<any>) => {
    const rawTotals = meals.reduce(
      (acc, m) => ({
        protein: acc.protein + (m.protein ?? 0),
        calories: acc.calories + (m.calories ?? 0),
        carbohydrates: acc.carbohydrates + (m.carbohydrates ?? 0),
        fat: acc.fat + (m.fat ?? 0),
        fiber: acc.fiber + (m.fiber ?? 0),
      }),
      { protein: 0, calories: 0, carbohydrates: 0, fat: 0, fiber: 0 }
    );

    const totals = {
      protein: roundToOneDecimal(rawTotals.protein),
      calories: roundToOneDecimal(rawTotals.calories),
      carbohydrates: roundToOneDecimal(rawTotals.carbohydrates),
      fat: roundToOneDecimal(rawTotals.fat),
      fiber: roundToOneDecimal(rawTotals.fiber),
    };

    return {
      date: selectedDate,
      meals,
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

  const handleRemoveMeal = (mealId: string) => {
    if (mealId === selectedLoggedMealId) {
      setSelectedLoggedMealId(null);
      setLastLoggedMeal(null);
    }

    const { weekStartISO, weekEndISO } = getWeekBoundsFromDateKey(selectedDate);

    setDailyNutritionSummaries(prev => {
      const existingSummary = prev[selectedDate];
      if (!existingSummary) return prev;

      const updatedMeals = (existingSummary.meals ?? []).filter(meal => meal?.id !== mealId);
      const next = { ...prev };

      if (!updatedMeals.length) {
        delete next[selectedDate];

        const recalculatedWeekTracking = buildWeekTrackingFromSummaries(next, weekStartISO, weekEndISO, activeWeeklyTrackingKeys);
        setWeeklyTracking(previousWeeklyTracking => {
          const updatedWeeklyTracking = { ...previousWeeklyTracking };
          if (Object.keys(recalculatedWeekTracking).length > 0) {
            updatedWeeklyTracking[weekStartISO] = recalculatedWeekTracking;
          } else {
            delete updatedWeeklyTracking[weekStartISO];
          }
          return updatedWeeklyTracking;
        });

        return next;
      }

      next[selectedDate] = buildDailySummary(updatedMeals);

      const recalculatedWeekTracking = buildWeekTrackingFromSummaries(next, weekStartISO, weekEndISO, activeWeeklyTrackingKeys);
      setWeeklyTracking(previousWeeklyTracking => {
        const updatedWeeklyTracking = { ...previousWeeklyTracking };
        if (Object.keys(recalculatedWeekTracking).length > 0) {
          updatedWeeklyTracking[weekStartISO] = recalculatedWeekTracking;
        } else {
          delete updatedWeeklyTracking[weekStartISO];
        }
        return updatedWeeklyTracking;
      });

      return next;
    });
  };

  const handleStartEditMealName = (mealId: string, currentName: string) => {
    setEditingMealId(mealId);
    setEditingMealName(currentName);
    setIsEditMealModalVisible(true);
  };

  const handleCloseEditMealModal = () => {
    setIsEditMealModalVisible(false);
    setEditingMealId(null);
    setEditingMealName('');
  };

  const handleSaveMealName = () => {
    if (!editingMealId) {
      handleCloseEditMealModal();
      return;
    }

    setDailyNutritionSummaries(prev => {
      const existingSummary = prev[selectedDate];
      if (!existingSummary) return prev;

      const nextMealName = editingMealName.trim() || t('nutritionLogger.unnamedMeal');
      const updatedMeals = (existingSummary.meals ?? []).map(meal => (
        meal?.id === editingMealId
          ? { ...meal, mealName: nextMealName }
          : meal
      ));

      if (editingMealId === selectedLoggedMealId) {
        setLastLoggedMeal(prevMeal => (
          prevMeal
            ? { ...prevMeal, mealName: nextMealName }
            : prevMeal
        ));
      }

      return {
        ...prev,
        [selectedDate]: buildDailySummary(updatedMeals),
      };
    });

    handleCloseEditMealModal();
  };

  const toParsedMacroAnalysis = (meal: any): ParsedMacroAnalysis => ({
    mealName: typeof meal?.mealName === 'string' && meal.mealName.trim().length > 0
      ? meal.mealName
      : t('nutritionLogger.unnamedMeal'),
    protein: typeof meal?.protein === 'number' ? meal.protein : 0,
    calories: typeof meal?.calories === 'number' ? meal.calories : 0,
    carbohydrates: typeof meal?.carbohydrates === 'number' ? meal.carbohydrates : 0,
    fat: typeof meal?.fat === 'number' ? meal.fat : 0,
    fiber: typeof meal?.fiber === 'number' ? meal.fiber : 0,
    fiberByType: typeof meal?.fiberByType === 'object' && meal.fiberByType !== null ? meal.fiberByType : {},
    fiberSubtypeTotals: typeof meal?.fiberSubtypeTotals === 'object' && meal.fiberSubtypeTotals !== null ? meal.fiberSubtypeTotals : {},
    polyphenolByType: typeof meal?.polyphenolByType === 'object' && meal.polyphenolByType !== null ? meal.polyphenolByType : {},
    microbiomeSupport: Array.isArray(meal?.microbiomeSupport) ? meal.microbiomeSupport : [],
  });

  const handleSelectLoggedMeal = (meal: any, mealId: string) => {
    setSelectedLoggedMealId(mealId);
    setLastLoggedMeal(toParsedMacroAnalysis(meal));
  };

  // Ny: hantera lokal fil från ImagePickerButton via NutritionAnalyze
  const handleImageSelected = async (file: { uri: string; name: string; type: string }) => {
    const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase();
    const locale: 'sv' | 'en' = activeLanguage.startsWith('sv') ? 'sv' : 'en';

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisEvidence(null);
    setLastLoggedMeal(null);

    try {
      const data = await NutritionAnalyze({
        uri: file.uri,
        name: file.name,
        type: file.type,
        locale,
        prompt: trackingPromptForAI,
        weeklyTrackingTargets: activeWeeklyTrackingTargetsForAI,
      });

      console.log('NutritionAnalyze payload:', data);

      if (data?.type === 'error') {
        const backendMessage =
          (typeof data?.message === 'string' && data.message)
          || (typeof data?.content === 'string' && data.content)
          || t('dayEdit.analysisFailed')
          || '❌ Misslyckades med att analysera bilden.';

        let rawDetails: string | null = null;
        if (typeof data?.raw === 'string') {
          rawDetails = data.raw;
        } else if (data?.raw) {
          rawDetails = JSON.stringify(data.raw);
        }

        setAnalysisResult(`❌ ${backendMessage}`);
        if (rawDetails) {
          setAnalysisEvidence(`Backend details: ${rawDetails}`);
        }
        return;
      }

      // Försök plocka ut strukturerad nutrition-data från responsen
      let analysis: ParsedMacroAnalysis | null = null;
      let parsedContent: any = null;

      if (data?.content) {
        // försök parse JSON från content
        try {
          const parsed = JSON.parse(data.content);
          parsedContent = parsed;
        } catch {
          // inget JSON — visa textinnehåll för användaren
        }
      }

      analysis = extractStructuredAnalysis(data, parsedContent);
      const typedTotals = extractTypedTotals(data, parsedContent);
      const microbiomeSupport = extractMicrobiomeSupport(data, parsedContent);
      const aiWeeklyTrackingSignals = extractWeeklyTrackingSignals(data, parsedContent);

      const evidence = extractEvidence(data, parsedContent);
      setAnalysisEvidence(buildEvidenceMessage(evidence));

      if (!analysis) {
        // Om vi inte fick strukturerad data, visa textinnehåll eller generellt meddelande
        const text =
          data?.content ?? t('dayEdit.analysisNoStructuredData') ?? 'Ingen strukturerad näringsdata hittades.';
        setAnalysisResult(typeof text === 'string' ? text : JSON.stringify(text));
        return;
      }

      analysis = {
        ...analysis,
        mealName: analysis.mealName || t('nutritionLogger.unnamedMeal'),
        fiberByType: typedTotals.fiberByType,
        fiberSubtypeTotals: typedTotals.fiberSubtypeTotals,
        polyphenolByType: typedTotals.polyphenolByType,
        microbiomeSupport,
      };

      const hasMacroData = !(
        analysis.protein === 0
        && analysis.calories === 0
        && analysis.carbohydrates === 0
        && analysis.fat === 0
        && analysis.fiber === 0
      );
      const hasTypedNutritionData =
        hasAnyTypedTotals(typedTotals.fiberByType)
        || hasAnyTypedTotals(typedTotals.fiberSubtypeTotals)
        || hasAnyTypedTotals(typedTotals.polyphenolByType);
      const hasMicrobiomeData = microbiomeSupport.length > 0;
      const hasTrackingSignals = Object.keys(aiWeeklyTrackingSignals).length > 0;

      if (!hasMacroData && !hasTypedNutritionData && !hasMicrobiomeData && !hasTrackingSignals) {
        const text =
          data?.content
          ?? 'AI hittade ingen tillforlitlig macro-data i svaret. Prova en tydligare bild eller en narbild pa tallriken.';
        setAnalysisResult(typeof text === 'string' ? text : JSON.stringify(text));
        setLastLoggedMeal(null);
        return;
      }

      // Uppdatera storage med verklig analys
      setDailyNutritionSummaries(prev => {
        const existing = prev[selectedDate]?.meals ?? [];
        const newMeal = {
          id: `${selectedDate}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date: selectedDate,
          ...analysis,
        };
        setSelectedLoggedMealId(newMeal.id);

        // Dynamic weekly tracking from AI backend signals only.
        const mealDateLocal = parseDateKeyLocal(selectedDate);
        const weekStartDate = getStartOfWeekMonday(mealDateLocal);
        const weekStartISO = toDateKeyLocal(weekStartDate);
        const mergedSignals: WeeklyTrackingSignals = {};
        Object.entries(aiWeeklyTrackingSignals).forEach(([key, value]) => {
          mergeWeeklyTrackingSignal(mergedSignals, key, value);
        });

        const signalsToApply = Object.entries(mergedSignals).filter(([key]) => activeWeeklyTrackingKeys.has(key));

        const mealWeeklyTrackingSignals = signalsToApply.reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {} as WeeklyTrackingSignals);

        const newMealWithTracking = {
          ...newMeal,
          weeklyTrackingSignals: mealWeeklyTrackingSignals,
        };

        const updatedMealsWithTracking = [...existing, newMealWithTracking];

        signalsToApply.forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach(item => addToWeeklyTracking(weekStartISO, key, item));
            return;
          }

          const existingCount = weeklyTracking[weekStartISO]?.[key];
          const nextCount = (typeof existingCount === 'number' ? existingCount : 0) + value;
          addToWeeklyTracking(weekStartISO, key, nextCount);
        });

        return {
          ...prev,
          [selectedDate]: buildDailySummary(updatedMealsWithTracking),
        };
      });

      setLastLoggedMeal(analysis);
      setAnalysisResult('✅ Måltid loggad och analyserad!');
    } catch (err) {
      console.error('Error analyzing image:', err);
      const errMsg = err instanceof Error ? err.message : '';
      if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('socket hang up')) {
        setAnalysisResult('❌ Backend tappade anslutning till AI (socket hang up). Prova igen med en mindre bild.');
      } else {
        setAnalysisResult(t('dayEdit.analysisFailed') ?? '❌ Misslyckades med att analysera bilden.');
      }
      setAnalysisEvidence(null);
      setLastLoggedMeal(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const summary = dailyNutritionSummaries[selectedDate];
  const dailyFiberByType = summary ? sumTypedTotals(summary.meals, 'fiberByType') : {};
  const dailyFiberSubtypeTotals = summary ? sumTypedTotals(summary.meals, 'fiberSubtypeTotals') : {};
  const dailyPolyphenolByType = summary ? sumTypedTotals(summary.meals, 'polyphenolByType') : {};
  const dailyMicrobiomeSupport = summary ? sumMicrobiomeSupport(summary.meals) : [];

  const selectedDateLocal = parseDateKeyLocal(selectedDate);
  const weekStartDate = getStartOfWeekMonday(selectedDateLocal);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const weekStartKey = toDateKeyLocal(weekStartDate);
  const weekEndKey = toDateKeyLocal(weekEndDate);

  const weeklySummaries = Object.entries(dailyNutritionSummaries)
    .filter(([dateKey]) => dateKey >= weekStartKey && dateKey <= weekEndKey)
    .map(([, daySummary]) => daySummary);

  const weeklyMeals = weeklySummaries.flatMap(daySummary =>
    Array.isArray(daySummary?.meals) ? daySummary.meals : []
  );

  const weeklyFiberByType = sumTypedTotals(weeklyMeals, 'fiberByType');
  const weeklyPolyphenolByType = sumTypedTotals(weeklyMeals, 'polyphenolByType');
  const weeklyFiberTotal = weeklySummaries.reduce((sum, daySummary) => {
    const dayFiber = parseNumberValue(daySummary?.totals?.fiber) ?? 0;
    return sum + dayFiber;
  }, 0);

  const getDailyTargetValue = (tag: string, unit: 'g' | 'mg' | 'plants' | 'items' | 'count'): number => {
    if (unit === 'plants') {
      // Daily plant diversity not currently tracked, only weekly
      return 0;
    }
    if (unit === 'items' || unit === 'count') {
      // Weekly tracking metrics are only evaluated on weekly targets.
      return 0;
    }
    if (unit === 'g') {
      if (tag === 'fiber_total') return summary?.totals.fiber ?? 0;
      return dailyFiberByType[tag] ?? 0;
    }
    return dailyPolyphenolByType[tag] ?? 0;
  };

  const getWeeklyTargetValue = (tag: string, unit: 'g' | 'mg' | 'plants' | 'items' | 'count'): number => {
    if (unit === 'plants' || unit === 'items' || unit === 'count') {
      const value = weeklyTracking[weekStartKey]?.[tag];
      if (typeof value === 'number') return value;
      if (Array.isArray(value)) return value.length;
      return 0;
    }
    if (unit === 'g') {
      if (tag === 'fiber_total') return weeklyFiberTotal;
      return weeklyFiberByType[tag] ?? 0;
    }
    return weeklyPolyphenolByType[tag] ?? 0;
  };

  const nutritionPlanTipProgress = (plans?.nutrition ?? []).flatMap(planTip => {
    const tip = tips.find(candidate => candidate.id === planTip.tipId);
    if (!tip) return [];

    const fiberTargets = tip.fiberTargets ?? [];
    const polyphenolTargets = tip.polyphenolTargets ?? [];
    const plantDiversityTargets = tip.plantDiversityTargets ?? [];
    const weeklyTrackingTargets = tip.weeklyTrackingTargets ?? [];
    const allTargets = [...fiberTargets, ...polyphenolTargets, ...plantDiversityTargets, ...weeklyTrackingTargets].filter(
      target => target.period === 'daily' || target.period === 'weekly'
    );

    if (!allTargets.length) return [];

    const targets = allTargets.map(target => {
      const trackingKey = 'trackingKey' in target ? target.trackingKey : target.tag;
      const actual = target.period === 'weekly'
        ? getWeeklyTargetValue(trackingKey, target.unit)
        : getDailyTargetValue(trackingKey, target.unit);
      const weeklyTrackingValue = target.period === 'weekly' ? weeklyTracking[weekStartKey]?.[trackingKey] : undefined;
      const trackedItems = Array.isArray(weeklyTrackingValue)
        ? weeklyTrackingValue
            .map(item => item.trim())
            .filter(item => item.length > 0)
            .sort((a, b) => a.localeCompare(b))
        : undefined;
      const labelGroup = target.unit === 'plants' || target.unit === 'items' || target.unit === 'count'
        ? 'weeklyTrackingLabels'
        : (target.unit === 'g' ? 'fiberLabels' : 'polyphenolLabels');
      const periodLabel = target.period === 'weekly'
        ? t('nutritionLogger.periodWeekly')
        : t('nutritionLogger.periodDaily');

      return {
        tag: trackingKey,
        unit: target.unit,
        period: target.period,
        periodLabel,
        amount: target.amount,
        actual,
        isMet: actual >= target.amount,
        label: t(`nutritionLogger.${labelGroup}.${trackingKey}`),
        trackedItems,
      };
    });

    const metCount = targets.reduce((count, target) => count + (target.isMet ? 1 : 0), 0);
    const totalCount = targets.length;

    return [{
      planTipId: planTip.id,
      tipId: tip.id,
      title: tip.title,
      areaId: tip.areas[0]?.id,
      targets,
      metCount,
      totalCount,
      isFulfilled: metCount === totalCount,
      progress: totalCount > 0 ? metCount / totalCount : 0,
    }];
  });

  useEffect(() => {
    nutritionPlanTipProgress.forEach(tipProgress => {
      const planTipId = tipProgress.planTipId ?? 'no-plan-tip-id';

      const dailyTargets = tipProgress.targets.filter(target => target.period === 'daily');
      const weeklyTargets = tipProgress.targets.filter(target => target.period === 'weekly');

      const isDailyComplete = dailyTargets.length > 0 && dailyTargets.every(target => target.isMet);
      const isWeeklyComplete = weeklyTargets.length > 0 && weeklyTargets.every(target => target.isMet);

      if (isDailyComplete) {
        claimNutritionTipCompletionXP?.({
          claimKey: `${planTipId}|${tipProgress.tipId}|daily|${selectedDate}`,
          tipId: tipProgress.tipId,
          planTipId,
          period: 'daily',
          periodKey: selectedDate,
          amount: XP_FOR_NUTRITION_TIP_DAILY_COMPLETION,
        });
      }

      if (isWeeklyComplete) {
        claimNutritionTipCompletionXP?.({
          claimKey: `${planTipId}|${tipProgress.tipId}|weekly|${weekStartKey}`,
          tipId: tipProgress.tipId,
          planTipId,
          period: 'weekly',
          periodKey: weekStartKey,
          amount: XP_FOR_NUTRITION_TIP_WEEKLY_COMPLETION,
        });
      }
    });
  }, [claimNutritionTipCompletionXP, nutritionPlanTipProgress, selectedDate, weekStartKey]);

  return (
    <KeyboardAvoidingView style={globalStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ImagePickerButton
          onImageSelected={handleImageSelected}
          isLoading={isAnalyzing}
          style={styles.imagePickerButton}
        />
        {/*{Object.keys(dailyNutritionSummaries).length > 0 && (
          <AppButton
            title={t('nutritionLogger.clearAllMeals', { defaultValue: 'Rensa alla meals' })}
            onPress={handleClearAllNutritionMeals}
            label: t(`nutritionLogger.${labelGroup}.${trackingKey}`),
            style={styles.clearAllMealsButton}
          />
        )}
         {analysisResult && <ThemedText type="defaultSemiBold">{analysisResult}</ThemedText>}
        {analysisEvidence && <ThemedText style={styles.evidenceText}>{analysisEvidence}</ThemedText>} */}

        {lastLoggedMeal && (
          <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
            <ThemedText type="title3">{t('nutritionLogger.mealTitleWithName', { name: lastLoggedMeal.mealName })}</ThemedText>
            <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
              <IconSymbol name="flame" size={16} color={colors.textMuted} />
              <ThemedText type="default">{t('nutritionLogger.calories', { value: lastLoggedMeal.calories })}</ThemedText>
            </View>
            <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
              <IconSymbol name="protein" size={16} color={colors.textMuted} />
              <ThemedText type="default">{t('nutritionLogger.protein', { value: lastLoggedMeal.protein })}</ThemedText>
            </View>
            <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
              <IconSymbol name="carbs" size={16} color={colors.textMuted} />
              <ThemedText type="default">{t('nutritionLogger.carbohydrates', { value: lastLoggedMeal.carbohydrates })}</ThemedText>
            </View>
            <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
              <IconSymbol name="fat" size={16} color={colors.textMuted} />
              <ThemedText type="default">{t('nutritionLogger.fat', { value: lastLoggedMeal.fat })}</ThemedText>
            </View>
            {hasAnyTypedTotals(lastLoggedMeal.fiberByType) ? (
              <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
                <Collapsible
                  title={t('nutritionLogger.fiber', { value: lastLoggedMeal.fiber })}
                  titleType="default"
                  initialCollapsed
                  leftContent={<IconSymbol name="fiber" size={14} color={colors.textMuted} />}
                >
                  {FIBER_TYPE_KEYS.map(key => {
                    const value = lastLoggedMeal.fiberByType[key] ?? 0;
                    if (value <= 0) return null;
                    const subtypeRows = getFiberSubtypeAmountsForCategory(key, lastLoggedMeal.fiberSubtypeTotals);
                    return (
                      <View key={key} style={styles.fiberCategoryRow}>
                        <ThemedText type="default">
                          • {t(`nutritionLogger.fiberLabels.${key}`)}: {value.toFixed(1)} g
                        </ThemedText>
                        {subtypeRows.map(row => (
                          <ThemedText key={`${key}_${row.subtype}`} type="caption" style={styles.fiberSubtypeText}>
                            - {row.label}: {row.amount.toFixed(1)} g
                          </ThemedText>
                        ))}
                      </View>
                    );
                  })}
                </Collapsible>
              </View>
            ) : (
              <ThemedText type="default">{t('nutritionLogger.fiber', { value: lastLoggedMeal.fiber })}</ThemedText>
            )}

            {hasAnyTypedTotals(lastLoggedMeal.polyphenolByType) && (
              <View style={[styles.nutrientRow, { borderColor: colors.textMuted }]}>
                <Collapsible
                  title={t('nutritionLogger.polyphenols', { value: (lastLoggedMeal.polyphenolByType.polyphenols_total ?? 0).toFixed(1) })}
                  titleType="default"
                  initialCollapsed
                  leftContent={<IconSymbol name="polyphenol" size={14} color={colors.textMuted} />}
                >
                  {POLYPHENOL_TYPE_KEYS.filter(key => key !== 'polyphenols_total').map(key => {
                    const value = lastLoggedMeal.polyphenolByType[key] ?? 0;
                    if (value <= 0) return null;
                    return (
                      <ThemedText key={key} type="default">
                        • {t(`nutritionLogger.polyphenolLabels.${key}`)}: {value.toFixed(1)} mg
                      </ThemedText>
                    );
                  })}
                </Collapsible>
              </View>
            )}

            {lastLoggedMeal.microbiomeSupport.length > 0 && (

                <Collapsible
                  title={t('nutritionLogger.microbiomeYes', { count: lastLoggedMeal.microbiomeSupport.length })}
                  titleType="default"
                  initialCollapsed
                  leftContent={<IconSymbol name="microbiome" size={14} color={colors.textMuted} />}
                >
                  {lastLoggedMeal.microbiomeSupport.map(item => (
                    <View key={`meal_${item.microbe}`} style={styles.microbeRow}>
                      <ThemedText type="default">• {item.microbe}: {item.supportLevel}</ThemedText>
                      {item.linkedNutrients.length > 0 && (
                        <ThemedText type="caption" style={styles.fiberSubtypeText}>
                          {t('nutritionLogger.linkedNutrients')}: {item.linkedNutrients.join(', ')}
                        </ThemedText>
                      )}
                      {item.likelyFoods.length > 0 && (
                        <ThemedText type="caption" style={styles.fiberSubtypeText}>
                          {t('nutritionLogger.sources')}: {item.likelyFoods.join(', ')}
                        </ThemedText>
                      )}
                    </View>
                  ))}
                </Collapsible>
            )}
          </Card>
        )}

        {summary && (
          <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
            <Collapsible
              title={t('nutritionLogger.summaryTitle')}
              titleType="title3"
              initialCollapsed
              rightContent={
                <View style={styles.summaryQuickRow}>
                  <View style={styles.summaryQuickItem}>
                    <IconSymbol name="flame" size={14} color={colors.textMuted} />
                    <ThemedText type="caption">{Math.round(summary.totals.calories)}</ThemedText>
                  </View>
                  <View style={styles.summaryQuickItem}>
                    <IconSymbol name="fiber" size={14} color={colors.textMuted} />
                    <ThemedText type="caption">{summary.totals.fiber.toFixed(1)} g</ThemedText>
                  </View>
                </View>
              }
            >
              <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
                <IconSymbol name="flame" size={16} color={colors.textMuted} />
                <ThemedText type="default">{t('nutritionLogger.calories', { value: summary.totals.calories })}</ThemedText>
              </View>
              <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
                <IconSymbol name="protein" size={16} color={colors.textMuted} />
                <ThemedText type="default">{t('nutritionLogger.protein', { value: roundToOneDecimal(summary.totals.protein) })}</ThemedText>
              </View>
              <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
                <IconSymbol name="carbs" size={16} color={colors.textMuted} />
                <ThemedText type="default">{t('nutritionLogger.carbohydrates', { value: roundToOneDecimal(summary.totals.carbohydrates) })}</ThemedText>
              </View>
              <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
                <IconSymbol name="fat" size={16} color={colors.textMuted} />
                <ThemedText type="default">{t('nutritionLogger.fat', { value: roundToOneDecimal(summary.totals.fat) })}</ThemedText>
              </View>

              {hasAnyTypedTotals(dailyFiberByType) ? (
                <View style={[styles.nutrientRow, { borderBottomColor: colors.textMuted }]}> 
                  <Collapsible
                    title={t('nutritionLogger.fiber', { value: summary.totals.fiber })}
                    titleType="default"
                    initialCollapsed
                    leftContent={<IconSymbol name="fiber" size={14} color={colors.textMuted} />}
                  >
                    {FIBER_TYPE_KEYS.map(key => {
                      const value = dailyFiberByType[key] ?? 0;
                      if (value <= 0) return null;
                      const subtypeRows = getFiberSubtypeAmountsForCategory(key, dailyFiberSubtypeTotals);
                      return (
                        <View key={key} style={styles.fiberCategoryRow}>
                          <ThemedText type="default">
                            • {t(`nutritionLogger.fiberLabels.${key}`)}: {value.toFixed(1)} g
                          </ThemedText>
                          {subtypeRows.map(row => (
                            <ThemedText key={`${key}_daily_${row.subtype}`} type="caption" style={styles.fiberSubtypeText}>
                              - {row.label}: {row.amount.toFixed(1)} g
                            </ThemedText>
                          ))}
                        </View>
                      );
                    })}
                  </Collapsible>
                </View>
              ) : (
                <ThemedText type="default">{t('nutritionLogger.fiber', { value: summary.totals.fiber })}</ThemedText>
              )}

              {hasAnyTypedTotals(dailyPolyphenolByType) && (
                <View style={[styles.nutrientRow, { borderBottomColor: colors.textMuted }]}> 
                  <Collapsible
                    title={t('nutritionLogger.polyphenols', { value: (dailyPolyphenolByType.polyphenols_total ?? 0).toFixed(1) })}
                    titleType="default"
                    initialCollapsed
                    leftContent={<IconSymbol name="polyphenol" size={14} color={colors.textMuted} />}
                  >
                    {POLYPHENOL_TYPE_KEYS.filter(key => key !== 'polyphenols_total').map(key => {
                      const value = dailyPolyphenolByType[key] ?? 0;
                      if (value <= 0) return null;
                      return (
                        <ThemedText key={key} type="default">
                          • {t(`nutritionLogger.polyphenolLabels.${key}`)}: {value.toFixed(1)} mg
                        </ThemedText>
                      );
                    })}
                  </Collapsible>
                </View>
              )}

              {dailyMicrobiomeSupport.length > 0 && (
                <Collapsible
                  title={t('nutritionLogger.microbiomeYes', { count: dailyMicrobiomeSupport.length })}
                  titleType="default"
                  initialCollapsed
                  leftContent={<IconSymbol name="microbiome" size={14} color={colors.textMuted} />}
                >
                  {dailyMicrobiomeSupport.map(item => (
                    <View key={`day_${item.microbe}`} style={styles.microbeRow}>
                      <ThemedText type="default">• {item.microbe}: {item.supportLevel}</ThemedText>
                      {item.linkedNutrients.length > 0 && (
                        <ThemedText type="caption" style={styles.fiberSubtypeText}>
                          {t('nutritionLogger.linkedNutrients')}: {item.linkedNutrients.join(', ')}
                        </ThemedText>
                      )}
                      {item.likelyFoods.length > 0 && (
                        <ThemedText type="caption" style={styles.fiberSubtypeText}>
                          {t('nutritionLogger.sources')}: {item.likelyFoods.join(', ')}
                        </ThemedText>
                      )}
                    </View>
                  ))}
                </Collapsible>
              )}
            </Collapsible>

          </Card>
        )}

        {summary && summary.meals.length > 0 && (
          <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
            <View style={styles.loggedMealsSection}>
              <Collapsible
                title={`${t('nutritionLogger.loggedMealsTitle')} (${summary.meals.length})`}
                titleType="default"
                initialCollapsed
              >
                {summary.meals.map((meal, index) => {
                  const mealName = typeof meal?.mealName === 'string' && meal.mealName.trim().length > 0
                    ? meal.mealName
                    : t('nutritionLogger.unnamedMeal');
                  const mealId = typeof meal?.id === 'string' ? meal.id : `${selectedDate}-fallback-${index}`;

                  return (
                    <SwipeableRow
                      key={mealId}
                      onEdit={() => handleStartEditMealName(mealId, mealName)}
                      onDelete={() => handleRemoveMeal(mealId)}
                      containerStyle={styles.loggedMealSwipeContent}
                    >
                      <TouchableOpacity
                        style={styles.loggedMealPressable}
                        onPress={() => handleSelectLoggedMeal(meal, mealId)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.loggedMealRow}>
                          <ThemedText type="default" style={styles.loggedMealName}>{mealName}</ThemedText>
                          <ThemedText type="default" style={[styles.loggedMealIcon, { color: colors.textMuted }]}> 
                            ⋮
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    </SwipeableRow>
                  );
                })}
              </Collapsible>
            </View>
          </Card>
        )}

        <Card style={{ borderRadius: globalStyles.borders.borderRadius }}>
            <ThemedText type="title3">{t('nutritionLogger.fulfilledTipsTitle')}</ThemedText>
            {nutritionPlanTipProgress.length > 0 ? (
              nutritionPlanTipProgress.map((tip, index) => (
                <TouchableOpacity
                  key={`${tip.tipId}-${tip.planTipId ?? 'no-plan-tip-id'}-${index}`}
                  style={[styles.planTipProgressRow, { borderBottomColor: colors.textMuted }]}
                  activeOpacity={0.8}
                  disabled={!tip.areaId}
                  onPress={() => {
                    if (!tip.areaId) return;
                    router.push({
                      pathname: `/dashboard/area/${tip.areaId}/details` as any,
                      params: {
                        tipId: tip.tipId,
                      },
                    });
                  }}
                > 
                  <View style={styles.planTipProgressHeader}>
                    <IconSymbol name={tip.isFulfilled ? 'checklist' : 'clock'} size={16} color={colors.textMuted} />
                    <ThemedText type="defaultSemiBold" style={styles.fulfilledTipTextBlock}>{t(`tips:${tip.title}`)}</ThemedText>
                  </View>
                  <ThemedText type="caption" style={styles.planTipStatusText}>
                    {tip.isFulfilled
                      ? t('nutritionLogger.tipStatusFulfilled')
                      : t('nutritionLogger.tipStatusNotFulfilled')}
                    {' • '}
                    {t('nutritionLogger.fulfilledTargetsCount', { met: tip.metCount, total: tip.totalCount })}
                  </ThemedText>
                  {tip.targets.map(target => {
                    const targetValueText = `${formatTargetValue(target.actual, target.unit)} / ${formatTargetValue(target.amount, target.unit)}`;
                    const hasTrackedItems = Array.isArray(target.trackedItems) && target.trackedItems.length > 0;
                    const trackedItems = target.trackedItems ?? [];

                    if (hasTrackedItems) {
                      return (
                        <View key={`${tip.tipId}-${target.tag}-${target.unit}-${target.period}`} style={styles.planTipTargetCollapsibleRow}>
                          <Collapsible
                            title={`${target.label} (${target.periodLabel}) • ${targetValueText}`}
                            titleType="caption"
                            initialCollapsed
                          >
                            <View style={styles.planTipTargetItemsList}>
                              {trackedItems.map(item => (
                                <ThemedText key={`${target.tag}-${item}`} type="caption" style={styles.planTipTargetItem}>
                                  • {item}
                                </ThemedText>
                              ))}
                            </View>
                          </Collapsible>
                        </View>
                      );
                    }

                    return (
                      <View key={`${tip.tipId}-${target.tag}-${target.unit}-${target.period}`} style={styles.planTipTargetRow}>
                        <ThemedText type="caption" style={styles.planTipTargetLabel}>
                          {target.label} ({target.periodLabel})
                        </ThemedText>
                        <ThemedText
                          type="caption"
                          style={[
                            styles.planTipTargetValue,
                            { color: target.isMet ? colors.primary : colors.textMuted },
                          ]}
                        >
                          {targetValueText}
                        </ThemedText>
                      </View>
                    );
                  })}
                  <View style={[styles.progressTrack, { backgroundColor: colors.secondaryBackground }]}> 
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(tip.progress * 100)}%`,
                          backgroundColor: tip.isFulfilled ? colors.primary : colors.icon,
                        },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <ThemedText type="caption" style={styles.noFulfilledTipsText}>
                {t('nutritionLogger.noPlanTipsWithTargets')}
              </ThemedText>
            )}
          </Card>

        <ThemedModal
          visible={isEditMealModalVisible}
          title={t('nutritionLogger.editMealNameTitle')}
          onClose={handleCloseEditMealModal}
          onSave={handleSaveMealName}
        >
          <View style={styles.editMealModalContent}>
            <LabeledInput
              label={t('nutritionLogger.mealNameLabel')}
              value={editingMealName}
              onChangeText={setEditingMealName}
              autoCapitalize="sentences"
              autoCorrect={false}
              autoFocus
            />
          </View>
        </ThemedModal>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  label: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: 'bold',
  },
  result: {
    marginTop: 20,
    fontSize: 16,
  },
  evidenceText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  imagePickerButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  clearAllMealsButton: {
    marginBottom: 12,
  },
  nutrientRow: {
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nutrientRowWithIcon: {
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingLeft: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownSection: {
    marginTop: 12,
    gap: 4,
  },
  fiberCategoryRow: {
    marginBottom: 4,
  },
  fiberSubtypeText: {
    marginLeft: 14,
    opacity: 0.85,
  },
  microbeRow: {
    marginBottom: 6,
  },
  loggedMealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  loggedMealPressable: {
    width: '100%',
    justifyContent: 'center',
  },
  loggedMealName: {
    flex: 1,
  },
  loggedMealSwipeContent: {
    height: 50,
    justifyContent: 'center',
    width: '100%',
    borderRadius: 0,
    overflow: 'hidden',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  loggedMealIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  loggedMealsSection: {
    marginTop: 2,
  },
  fulfilledTipTextBlock: {
    flex: 1,
  },
  planTipProgressRow: {
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  planTipProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planTipStatusText: {
    marginTop: 4,
    marginBottom: 6,
  },
  planTipTargetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  planTipTargetCollapsibleRow: {
    marginBottom: 4,
    width: '100%',
  },
  planTipTargetLabel: {
    flex: 1,
  },
  planTipTargetValue: {
    textAlign: 'right',
  },
  planTipTargetItemsList: {
    marginTop: 4,
    marginLeft: 4,
    gap: 2,
  },
  planTipTargetItem: {
    opacity: 0.9,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  noFulfilledTipsText: {
    marginTop: 8,
  },
  editMealModalContent: {
    width: '100%',
  },
  summaryQuickRow: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryQuickItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  collapsibleTitleIcon: {
    marginLeft: 'auto',
  },
});

export default NutritionLogger;
