import { useTheme } from '@react-navigation/native';
import { t as i18nT } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { FIBER_CATEGORY_SUBTYPES, type FiberSubtype } from '@/locales/tips';
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

const NutritionLogger: React.FC<NutritionLoggerProps> = ({ selectedDate }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  
    
  const { dailyNutritionSummaries, setDailyNutritionSummaries } = useStorage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisEvidence, setAnalysisEvidence] = useState<string | null>(null);
  const [lastLoggedMeal, setLastLoggedMeal] = useState<ParsedMacroAnalysis | null>(null);
  const [selectedLoggedMealId, setSelectedLoggedMealId] = useState<string | null>(null);
  const [isEditMealModalVisible, setIsEditMealModalVisible] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealName, setEditingMealName] = useState('');

  useEffect(() => {
    setLastLoggedMeal(null);
    setSelectedLoggedMealId(null);
    setIsEditMealModalVisible(false);
    setEditingMealId(null);
    setEditingMealName('');
  }, [selectedDate]);

  const buildDailySummary = (meals: Array<any>) => {
    const totals = meals.reduce(
      (acc, m) => ({
        protein: acc.protein + (m.protein ?? 0),
        calories: acc.calories + (m.calories ?? 0),
        carbohydrates: acc.carbohydrates + (m.carbohydrates ?? 0),
        fat: acc.fat + (m.fat ?? 0),
        fiber: acc.fiber + (m.fiber ?? 0),
      }),
      { protein: 0, calories: 0, carbohydrates: 0, fat: 0, fiber: 0 }
    );

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

    setDailyNutritionSummaries(prev => {
      const existingSummary = prev[selectedDate];
      if (!existingSummary) return prev;

      const updatedMeals = (existingSummary.meals ?? []).filter(meal => meal?.id !== mealId);
      const next = { ...prev };

      if (!updatedMeals.length) {
        delete next[selectedDate];
        return next;
      }

      next[selectedDate] = buildDailySummary(updatedMeals);
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
        prompt: 'nutrition_analysis', // valfri prompt, kan anpassas
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
      setLastLoggedMeal(analysis);

      if (
        analysis.protein === 0
        && analysis.calories === 0
        && analysis.carbohydrates === 0
        && analysis.fat === 0
        && analysis.fiber === 0
      ) {
        const text =
          data?.content
          ?? 'AI hittade ingen tillforlitlig macro-data i svaret. Prova en tydligare bild eller en narbild pa tallriken.';
        setAnalysisResult(typeof text === 'string' ? text : JSON.stringify(text));
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
        const updatedMeals = [...existing, newMeal];

        return {
          ...prev,
          [selectedDate]: buildDailySummary(updatedMeals),
        };
      });

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

  return (
    <KeyboardAvoidingView style={globalStyles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <ImagePickerButton
          onImageSelected={handleImageSelected}
          isLoading={isAnalyzing}
          label={t('dayEdit.pickImage')}
          style={styles.imagePickerButton}
        />
        {/* {analysisResult && <ThemedText type="defaultSemiBold">{analysisResult}</ThemedText>}
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
                <ThemedText type="default">{t('nutritionLogger.protein', { value: summary.totals.protein })}</ThemedText>
              </View>
              <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
                <IconSymbol name="carbs" size={16} color={colors.textMuted} />
                <ThemedText type="default">{t('nutritionLogger.carbohydrates', { value: summary.totals.carbohydrates })}</ThemedText>
              </View>
              <View style={[styles.nutrientRowWithIcon, { borderBottomColor: colors.textMuted }]}>
                <IconSymbol name="fat" size={16} color={colors.textMuted} />
                <ThemedText type="default">{t('nutritionLogger.fat', { value: summary.totals.fat })}</ThemedText>
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
