import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

import type { DailyNutritionTracking, TipProgressItem, WeeklyTrackingItem } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { XP_FOR_NUTRITION_TIP_DAILY_COMPLETION, XP_FOR_NUTRITION_TIP_WEEKLY_COMPLETION } from '@/constants/XP';
import { useNutritionPlanProgress } from '@/hooks/useNutritionPlanProgress';
import { getDrinkImage } from '@/locales/drinkCatalog';
import { tips } from '@/locales/tips';
import { type DetectedDrink, isAlcohol, NutritionAnalyze } from '@/services/gptServices';
import { MicrobiomeSupportEntry } from '@/types/microbiome';
import { type NutritionTargetPeriod } from '@/types/nutritionTargets';
import {
  type ConfidenceLevel,
  extractAndValidateNutritionAnalysis,
  extractWeeklyTrackingSignals,
  mergeWeeklyTrackingSignal,
  type ParsedMacroAnalysis,
  parseNumberValue,
  roundToOneDecimal,
  type WeeklyTrackingSignals,
} from '@/utils/analyzeNutrition';
import { toRecordedAt } from '@/utils/dateUtils';

import { MINERAL_TYPE_KEYS } from '../../constants/minerals';
import { Collapsible } from '../Collapsible';
import CopyMealBottomSheet from '../CopyMealBottomSheet';
import ImagePickerButton from '../ImagePickerButton';
import { handleGeneralError, handleNutritionError, handleSocketError } from '../nutritionAnalysisHelpers';
import NutritionBreakdown from '../NutritionBreakdown';
import { ThemedModal } from '../ThemedModal';
import { ThemedText } from '../ThemedText';
import AddButton from '../ui/AddButton';
import { Card } from '../ui/Card';
import { DateTimeInput } from '../ui/DateTimeInput';
import DiscreetButton from '../ui/DiscreetButton';
import { IconSymbol } from '../ui/IconSymbol';
import LabeledInput from '../ui/LabeledInput';
import { LoggedDrinksSection } from './LoggedDrinksSection';
import { LoggedMealsSection } from './LoggedMealsSection';
import NutritionPlanTargetsSection, { getTipProgressKey } from './NutritionPlanTargetsSection';
import PackagingAnalysisModal, { SelectedImageFile } from './PackagingAnalysisModal';

interface NutritionLoggerTabProps {
  selectedDate: string;
  onTipCompleted?: (targetY?: number) => void;
}

type RecentMealOption = {
  id: string;
  date: string;
  meal: any;
  mealName: string;
  sortOrder: number;
};

type ReviewDrink = DetectedDrink & {
  confirmed: boolean;
};

type PendingAnalysisReview = {
  analysis: ParsedMacroAnalysis | null;
  weeklyTrackingSignals: WeeklyTrackingSignals;
  detectedDrinks: ReviewDrink[];
  evidence: {
    sources: string[];
    inferred: string[];
    confidence: 'high' | 'medium' | 'low' | 'unknown';
  } | null;
  aiDescription: string | null;
  evidenceMessage: string | null;
  statusMessage: string | null;
};

const BottomSheetOverlayContainer = ({ children }: { children?: React.ReactNode }) => <FullWindowOverlay>{children}</FullWindowOverlay>;

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
  const dayOfWeek = result.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getWeekBoundsFromDateKey = (
  dateKey: string
): {
  weekStartISO: string;
  weekEndISO: string;
} => {
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
): Record<string, WeeklyTrackingItem[] | number> => {
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

const sumTypedTotals = (
  meals: Array<any>,
  key: 'fiberByType' | 'fiberSubtypeTotals' | 'polyphenolByType' | 'mineralsByType' | 'vitaminsByType' | 'aminoAcidsByType'
) =>
  meals.reduce(
    (acc, meal) => {
      const rawValue = meal?.[key];
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

const sumMicrobiomeSupport = (meals: Array<any>): MicrobiomeSupportEntry[] => {
  const allEntries = meals.flatMap(meal => (Array.isArray(meal?.microbiomeSupport) ? meal.microbiomeSupport : []));
  const byMicrobe = new Map<string, MicrobiomeSupportEntry>();
  allEntries.forEach((entry: MicrobiomeSupportEntry) => {
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

const mergeMineralConfidenceFromMeals = (meals: Array<any>): Record<string, ConfidenceLevel> => {
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
  const mergeConfidenceLevel = (current: ConfidenceLevel, next: ConfidenceLevel): ConfidenceLevel =>
    confidenceRank[next] > confidenceRank[current] ? next : current;
  meals.forEach(meal => {
    const raw = meal?.mineralsConfidenceByType;
    if (!raw || typeof raw !== 'object') return;
    MINERAL_TYPE_KEYS.forEach(key => {
      const value = raw[key];
      if (value === 'high' || value === 'medium' || value === 'low' || value === 'unknown') {
        totals[key] = mergeConfidenceLevel(totals[key], value);
      }
    });
  });
  return totals;
};

const getNormalizedMealName = (meal: any, fallbackName: string): string =>
  typeof meal?.mealName === 'string' && meal.mealName.trim().length > 0 ? meal.mealName : fallbackName;

const coerceNumber = (val: unknown): number => (typeof val === 'number' ? val : 0);

const coerceObject = <T extends object>(val: unknown): T => (typeof val === 'object' && val !== null ? (val as T) : ({} as T));

const coerceArray = <T,>(val: unknown): T[] => (Array.isArray(val) ? (val as T[]) : []);

const BULLET_REGEX = /^([•*-]\s+|\d+[.)]\s+)/;

const computeTargetY = (
  tipKey: string,
  tipRowPeriodByKey: Record<string, NutritionTargetPeriod>,
  tipRowLocalYByKey: Record<string, number>,
  sectionY: number,
  periodSectionY: Record<NutritionTargetPeriod, number>
): number | undefined => {
  const period = tipRowPeriodByKey[tipKey];
  const rowLocalY = tipRowLocalYByKey[tipKey];
  const periodY = period ? periodSectionY[period] : 0;
  if (period && typeof rowLocalY === 'number') {
    return sectionY + periodY + rowLocalY;
  }
  return sectionY > 0 ? sectionY : undefined;
};

const buildDailySummary = (meals: Array<any>, selectedDate: string) => {
  const rawTotals = meals.reduce(
    (acc, m) => ({
      protein: acc.protein + (m.protein ?? 0),
      calories: acc.calories + (m.calories ?? 0),
      carbohydrates: acc.carbohydrates + (m.carbohydrates ?? 0),
      fat: acc.fat + (m.fat ?? 0),
      fiber: acc.fiber + (m.fiber ?? 0),
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

const parseInterpretationItems = (review: PendingAnalysisReview, fallback: string): string[] => {
  const aiText = review.aiDescription?.trim();
  if (aiText) {
    const lines = aiText
      .split(/\r?\n+/g)
      .map(line => line.replace(BULLET_REGEX, '').trim())
      .filter(line => line.length > 0);
    if (lines.length > 0) return lines;
  }
  const inferred = review.evidence?.inferred ?? [];
  if (inferred.length > 0) {
    const items = inferred
      .flatMap(item => item.split(/\r?\n+/g))
      .map(item => item.replace(BULLET_REGEX, '').trim())
      .filter(item => item.length > 0);
    if (items.length > 0) {
      return Array.from(new Set(items));
    }
  }
  return [fallback];
};

type RefBox<T> = {
  current: T;
};

type HandleTipCompletionTransitionsParams = {
  nutritionPlanTipProgress: TipProgressItem[];
  previousFulfilledByKeyRef: RefBox<Record<string, boolean>>;
  hasInitializedFulfilledTrackingRef: RefBox<boolean>;
  pendingCompletionScrollTimeoutRef: RefBox<ReturnType<typeof setTimeout> | null>;
  pendingCompletionAnimTimeoutRef: RefBox<ReturnType<typeof setTimeout> | null>;
  onTipCompleted?: (targetY?: number) => void;
  tipRowPeriodByKeyRef: RefBox<Record<string, NutritionTargetPeriod>>;
  tipRowLocalYByKeyRef: RefBox<Record<string, number>>;
  fulfilledTipsSectionYRef: RefBox<number>;
  periodSectionYRef: RefBox<Record<NutritionTargetPeriod, number>>;
  animateTipCompletion: (tipKey: string) => void;
  completionScrollDelayMs: number;
  completionAnimationDelayAfterScrollMs: number;
};

const handleTipCompletionTransitions = ({
  nutritionPlanTipProgress,
  previousFulfilledByKeyRef,
  hasInitializedFulfilledTrackingRef,
  pendingCompletionScrollTimeoutRef,
  pendingCompletionAnimTimeoutRef,
  onTipCompleted,
  tipRowPeriodByKeyRef,
  tipRowLocalYByKeyRef,
  fulfilledTipsSectionYRef,
  periodSectionYRef,
  animateTipCompletion,
  completionScrollDelayMs,
  completionAnimationDelayAfterScrollMs,
}: HandleTipCompletionTransitionsParams) => {
  const nextFulfilledByKey: Record<string, boolean> = {};
  const newlyFulfilledTipKeys: string[] = [];
  nutritionPlanTipProgress.forEach(tipProgress => {
    const tipKey = getTipProgressKey(tipProgress);
    const wasFulfilled = previousFulfilledByKeyRef.current[tipKey] ?? false;
    nextFulfilledByKey[tipKey] = tipProgress.isFulfilled;
    if (tipProgress.isFulfilled && !wasFulfilled) {
      newlyFulfilledTipKeys.push(tipKey);
    }
  });
  if (!hasInitializedFulfilledTrackingRef.current) {
    previousFulfilledByKeyRef.current = nextFulfilledByKey;
    hasInitializedFulfilledTrackingRef.current = true;
    return;
  }
  if (newlyFulfilledTipKeys.length > 0) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    const firstNewlyFulfilledTip = newlyFulfilledTipKeys[0];
    if (pendingCompletionScrollTimeoutRef.current) {
      clearTimeout(pendingCompletionScrollTimeoutRef.current);
    }
    if (pendingCompletionAnimTimeoutRef.current) {
      clearTimeout(pendingCompletionAnimTimeoutRef.current);
    }
    requestAnimationFrame(() => {
      pendingCompletionScrollTimeoutRef.current = setTimeout(() => {
        onTipCompleted?.(
          computeTargetY(
            firstNewlyFulfilledTip,
            tipRowPeriodByKeyRef.current,
            tipRowLocalYByKeyRef.current,
            fulfilledTipsSectionYRef.current,
            periodSectionYRef.current
          )
        );
        pendingCompletionScrollTimeoutRef.current = null;
      }, completionScrollDelayMs);
    });
    pendingCompletionAnimTimeoutRef.current = setTimeout(() => {
      newlyFulfilledTipKeys.forEach(key => animateTipCompletion(key));
      pendingCompletionAnimTimeoutRef.current = null;
    }, completionScrollDelayMs + completionAnimationDelayAfterScrollMs);
  }
  previousFulfilledByKeyRef.current = nextFulfilledByKey;
};

const NutritionLoggerTab: React.FC<NutritionLoggerTabProps> = ({ selectedDate, onTipCompleted }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const {
    plans,
    dailyNutritionTracking,
    setDailyNutritionTracking,
    setWeeklyNutritionTracking,
    dailyDrinkTracking,
    setDailyDrinkTracking,
    claimNutritionTipCompletionXP,
  } = useStorage();
  const nutritionPlanTipProgress = useNutritionPlanProgress(selectedDate);
  const { weekStartISO: weekStartKey } = getWeekBoundsFromDateKey(selectedDate);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalysisReviewModalVisible, setIsAnalysisReviewModalVisible] = useState(false);
  const [pendingAnalysisReview, setPendingAnalysisReview] = useState<PendingAnalysisReview | null>(null);
  const [lastLoggedMeal, setLastLoggedMeal] = useState<ParsedMacroAnalysis | null>(null);
  const [isPackagingModalVisible, setIsPackagingModalVisible] = useState(false);
  const [packagingMealImage, setPackagingMealImage] = useState<SelectedImageFile | null>(null);
  const lastAnalyzedFilesRef = useRef<{
    mealFile: SelectedImageFile;
    mealDescription: string;
    ingredientFile: SelectedImageFile | null;
  } | null>(null);
  const [selectedLoggedMealId, setSelectedLoggedMealId] = useState<string | null>(null);
  const [isEditMealModalVisible, setIsEditMealModalVisible] = useState(false);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editingMealName, setEditingMealName] = useState('');
  const [editingMealTime, setEditingMealTime] = useState<Date>(() => new Date());
  const [isEditDrinkModalVisible, setIsEditDrinkModalVisible] = useState(false);
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
  const [editingDrinkName, setEditingDrinkName] = useState('');
  const [editingDrinkTime, setEditingDrinkTime] = useState<Date>(() => new Date());
  const [mealTime, setMealTime] = useState<Date>(() => new Date());
  const previousFulfilledByKeyRef = useRef<Record<string, boolean>>({});
  const hasInitializedFulfilledTrackingRef = useRef(false);
  const completionAnimByKeyRef = useRef<Record<string, Animated.Value>>({});
  const copyMealBottomSheetRef = useRef<BottomSheetModal>(null);
  const fulfilledTipsSectionYRef = useRef(0);
  const periodSectionYRef = useRef<Record<NutritionTargetPeriod, number>>({
    daily: 0,
    weekly: 0,
  });
  const tipRowLocalYByKeyRef = useRef<Record<string, number>>({});
  const tipRowPeriodByKeyRef = useRef<Record<string, NutritionTargetPeriod>>({});
  const pendingCompletionScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCompletionAnimTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const COMPLETION_SCROLL_DELAY_MS = 80;
  const COMPLETION_ANIMATION_DELAY_AFTER_SCROLL_MS = 180;

  const interpretationItems = useMemo(
    () => (pendingAnalysisReview ? parseInterpretationItems(pendingAnalysisReview, t('nutritionLogger.analysisNoStructuredData')) : null),
    [pendingAnalysisReview, t]
  );

  const reAnalyzeTextStyle = useMemo(
    () => [styles.reAnalyzeText, isAnalyzing && styles.reAnalyzeTextDisabled, { color: colors.text }],
    [isAnalyzing, colors.text]
  );

  const reAnalyzePrefixStyle = useMemo(() => [styles.reAnalyzePrefix, { color: colors.text }], [colors.text]);

  const reAnalyzeHighlightStyle = useMemo(
    () => [
      styles.reAnalyzeHighlight,
      {
        color: colors.showAllAccent,
      },
    ],
    [colors.showAllAccent]
  );

  const getCompletionAnimValue = useCallback((tipKey: string): Animated.Value => {
    if (!completionAnimByKeyRef.current[tipKey]) {
      completionAnimByKeyRef.current[tipKey] = new Animated.Value(0);
    }
    return completionAnimByKeyRef.current[tipKey];
  }, []);

  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAnalysisReviewModalVisible) return;
    Haptics.selectionAsync().catch(() => undefined);
  }, [isAnalysisReviewModalVisible]);

  const animateTipCompletion = useCallback(
    (tipKey: string) => {
      const anim = getCompletionAnimValue(tipKey);
      anim.stopAnimation();
      anim.setValue(0);
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [getCompletionAnimValue]
  );

  const activeTrackingTargetsForAI = useMemo(() => {
    const byKey = new Map<
      string,
      {
        key: string;
        unit: 'items' | 'count';
        amount?: number;
        aiInstruction?: string;
      }
    >();
    (plans?.nutrition ?? []).forEach(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);
      (tip?.trackingTargets ?? []).forEach((target: { trackingKey: string; unit: 'items' | 'count'; amount?: number; aiInstruction?: string }) => {
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

  const activeTrackingKeys = useMemo(() => {
    const keys = new Set<string>();
    (plans?.nutrition ?? []).forEach(planTip => {
      const tip = tips.find(candidate => candidate.id === planTip.tipId);
      (tip?.trackingTargets ?? []).forEach((target: { trackingKey: string }) => {
        if (typeof target.trackingKey === 'string' && target.trackingKey.trim().length > 0) {
          keys.add(target.trackingKey.trim());
        }
      });
    });
    return keys;
  }, [plans]);

  const trackingPromptForAI = useMemo(() => {
    if (!activeTrackingTargetsForAI.length) {
      return 'nutrition_analysis';
    }
    const targetsJson = JSON.stringify(activeTrackingTargetsForAI);
    return [
      'nutrition_analysis',
      'tracking_targets_for_this_user:',
      targetsJson,
      'Only return weeklyTrackingSignals keys that exist in tracking_targets_for_this_user.',
      'For unit=items return items[]. For unit=count return countIncrement.',
    ].join('\n');
  }, [activeTrackingTargetsForAI]);

  useEffect(() => {
    setLastLoggedMeal(null);
    setSelectedLoggedMealId(null);
    setIsEditMealModalVisible(false);
    setEditingMealId(null);
    setEditingMealName('');
    setIsPackagingModalVisible(false);
    setPackagingMealImage(null);
    previousFulfilledByKeyRef.current = {};
    hasInitializedFulfilledTrackingRef.current = false;
    periodSectionYRef.current = {
      daily: 0,
      weekly: 0,
    };
    tipRowLocalYByKeyRef.current = {};
    tipRowPeriodByKeyRef.current = {};
    if (pendingCompletionScrollTimeoutRef.current) {
      clearTimeout(pendingCompletionScrollTimeoutRef.current);
      pendingCompletionScrollTimeoutRef.current = null;
    }
    if (pendingCompletionAnimTimeoutRef.current) {
      clearTimeout(pendingCompletionAnimTimeoutRef.current);
      pendingCompletionAnimTimeoutRef.current = null;
    }
  }, [selectedDate]);

  useEffect(() => {
    return () => {
      if (pendingCompletionScrollTimeoutRef.current) {
        clearTimeout(pendingCompletionScrollTimeoutRef.current);
      }
      if (pendingCompletionAnimTimeoutRef.current) {
        clearTimeout(pendingCompletionAnimTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const syncWeekTrackingForDate = (nextTracking: DailyNutritionTracking, dateKey: string) => {
    const { weekStartISO, weekEndISO } = getWeekBoundsFromDateKey(dateKey);
    const recalculatedWeekTracking = buildWeekTrackingFromSummaries(nextTracking, weekStartISO, weekEndISO, activeTrackingKeys);
    setWeeklyNutritionTracking(previous => {
      const next = { ...previous };
      if (Object.keys(recalculatedWeekTracking).length > 0) {
        next[weekStartISO] = recalculatedWeekTracking;
      } else {
        delete next[weekStartISO];
      }
      return next;
    });
  };

  const handleRemoveMeal = (mealId: string) => {
    if (mealId === selectedLoggedMealId) {
      setSelectedLoggedMealId(null);
      setLastLoggedMeal(null);
    }
    setDailyNutritionTracking(prev => {
      const existingSummary = prev[selectedDate];
      if (!existingSummary) return prev;
      const updatedMeals = (existingSummary.meals ?? []).filter(meal => meal?.id !== mealId);
      const next = { ...prev };
      if (!updatedMeals.length) {
        delete next[selectedDate];
        syncWeekTrackingForDate(next, selectedDate);
        return next;
      }
      next[selectedDate] = buildDailySummary(updatedMeals, selectedDate);
      syncWeekTrackingForDate(next, selectedDate);
      return next;
    });
  };

  const handleRemoveDrink = (drinkId: string) => {
    setDailyDrinkTracking(prev => {
      const updatedDrinks = (prev[selectedDate] ?? []).filter(drink => drink.id !== drinkId);

      const next = { ...prev };

      if (updatedDrinks.length === 0) {
        delete next[selectedDate];
      } else {
        next[selectedDate] = updatedDrinks;
      }

      return next;
    });
  };

  const handleStartEditMeal = (mealId: string, mealName: string) => {
    const meal = dailyNutritionTracking[selectedDate]?.meals.find(item => item.id === mealId);
    if (!meal) return;
    setEditingMealId(mealId);
    setEditingMealName(mealName);
    setEditingMealTime(new Date(meal.recordedAt));
    setIsEditMealModalVisible(true);
  };

  const handleCloseEditMealModal = () => {
    setIsEditMealModalVisible(false);
    setEditingMealId(null);
    setEditingMealName('');
    setEditingMealTime(new Date());
  };

  const handleStartEditDrink = (drinkId: string) => {
    const drink = dailyDrinkTracking[selectedDate]?.find(item => item.id === drinkId);
    if (!drink) return;
    setEditingDrinkId(drinkId);
    setEditingDrinkName(drink.name);
    setEditingDrinkTime(new Date(drink.recordedAt));
    setIsEditDrinkModalVisible(true);
  };

  const handleCloseEditDrinkModal = () => {
    setIsEditDrinkModalVisible(false);
    setEditingDrinkId(null);
    setEditingDrinkName('');
    setEditingDrinkTime(new Date());
  };

  const handleSaveDrink = () => {
    if (!editingDrinkId) {
      handleCloseEditDrinkModal();
      return;
    }
    const name = editingDrinkName.trim();
    if (!name) return;
    const recordedAt = toRecordedAt(selectedDate, editingDrinkTime);
    setDailyDrinkTracking(prev => ({
      ...prev,
      [selectedDate]: (prev[selectedDate] ?? []).map(drink =>
        drink.id === editingDrinkId
          ? {
              ...drink,
              name,
              recordedAt,
            }
          : drink
      ),
    }));
    handleCloseEditDrinkModal();
  };

  const handleOpenCopyMealModal = () => {
    copyMealBottomSheetRef.current?.present();
  };

  const handleCloseCopyMealModal = () => {
    copyMealBottomSheetRef.current?.dismiss();
  };

  const closeAnalysisReviewModal = useCallback(() => {
    setIsAnalysisReviewModalVisible(false);
    setPendingAnalysisReview(null);
  }, []);

  const handleToggleDrinkConfirmation = useCallback((index: number) => {
    setPendingAnalysisReview(current => {
      if (!current) return current;
      return {
        ...current,
        detectedDrinks: current.detectedDrinks.map((drink, drinkIndex) =>
          drinkIndex === index
            ? {
                ...drink,
                confirmed: !drink.confirmed,
              }
            : drink
        ),
      };
    });
  }, []);

  const handleSaveMeal = () => {
    if (!editingMealId) {
      handleCloseEditMealModal();
      return;
    }
    const nextMealName = editingMealName.trim() || t('nutritionLogger.unnamedMeal');
    const recordedAt = toRecordedAt(selectedDate, editingMealTime);
    setDailyNutritionTracking(prev => {
      const existingSummary = prev[selectedDate];
      if (!existingSummary) return prev;
      const updatedMeals = existingSummary.meals.map(meal =>
        meal.id === editingMealId
          ? {
              ...meal,
              mealName: nextMealName,
              recordedAt,
            }
          : meal
      );
      return {
        ...prev,
        [selectedDate]: buildDailySummary(updatedMeals, selectedDate),
      };
    });
    if (editingMealId === selectedLoggedMealId) {
      setLastLoggedMeal(prev =>
        prev
          ? {
              ...prev,
              mealName: nextMealName,
            }
          : prev
      );
    }
    handleCloseEditMealModal();
  };

  const handleSaveAnalyzedMeal = () => {
    if (!pendingAnalysisReview?.analysis) {
      closeAnalysisReviewModal();
      return;
    }
    const analysis = pendingAnalysisReview.analysis;
    const mealWeeklyTrackingSignals = pendingAnalysisReview.weeklyTrackingSignals;
    const recordedAt = toRecordedAt(selectedDate, mealTime);
    const confirmedDrinks = pendingAnalysisReview.detectedDrinks.filter(drink => drink.confirmed).map(({ confirmed: _confirmed, ...drink }) => drink);
    const mealId = `${selectedDate}-${Crypto.randomUUID()}`;

    setDailyNutritionTracking(prev => {
      const existingMeals = prev[selectedDate]?.meals ?? [];
      const newMeal = {
        id: mealId,
        recordedAt,
        ...analysis,
        weeklyTrackingSignals: mealWeeklyTrackingSignals,
      };
      const next = {
        ...prev,
        [selectedDate]: buildDailySummary([...existingMeals, newMeal], selectedDate),
      };
      setSelectedLoggedMealId(newMeal.id);
      syncWeekTrackingForDate(next, selectedDate);
      return next;
    });

    if (confirmedDrinks.length > 0) {
      const drinkEntries = confirmedDrinks.map(drink => ({
        id: Crypto.randomUUID(),
        mealId,
        ...drink,
        recordedAt,
        source: 'meal_analysis' as const,
      }));

      setDailyDrinkTracking(prev => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] ?? []), ...drinkEntries],
      }));
    }

    setLastLoggedMeal(analysis);
    setAnalysisResult('✅ Måltid loggad och analyserad!');
    triggerLightHaptic();
    closeAnalysisReviewModal();
  };

  const toParsedMacroAnalysis = (meal: any): ParsedMacroAnalysis => ({
    mealName: getNormalizedMealName(meal, t('nutritionLogger.unnamedMeal')),
    protein: coerceNumber(meal?.protein),
    calories: coerceNumber(meal?.calories),
    carbohydrates: coerceNumber(meal?.carbohydrates),
    fat: coerceNumber(meal?.fat),
    fiber: coerceNumber(meal?.fiber),
    fiberByType: coerceObject(meal?.fiberByType),
    fiberSubtypeTotals: coerceObject(meal?.fiberSubtypeTotals),
    polyphenolByType: coerceObject(meal?.polyphenolByType),
    mineralsByType: coerceObject(meal?.mineralsByType),
    mineralsConfidenceByType: coerceObject(meal?.mineralsConfidenceByType),
    vitaminsByType: coerceObject(meal?.vitaminsByType),
    aminoAcidsByType: coerceObject(meal?.aminoAcidsByType),
    microbiomeSupport: coerceArray(meal?.microbiomeSupport),
  });

  const handleCopyMeal = (mealToCopy: any) => {
    const copiedMeal = {
      ...mealToCopy,
      id: `${selectedDate}-${Crypto.randomUUID()}`,
      recordedAt: toRecordedAt(selectedDate, new Date()),
      mealName: getNormalizedMealName(mealToCopy, t('nutritionLogger.unnamedMeal')),
    };

    setDailyNutritionTracking(prev => {
      const existingMeals = prev[selectedDate]?.meals ?? [];
      const next = {
        ...prev,
        [selectedDate]: buildDailySummary([...existingMeals, copiedMeal], selectedDate),
      };
      syncWeekTrackingForDate(next, selectedDate);
      return next;
    });

    setSelectedLoggedMealId(copiedMeal.id);
    setLastLoggedMeal(toParsedMacroAnalysis(copiedMeal));
    triggerLightHaptic();
    handleCloseCopyMealModal();
  };

  const handleSelectLoggedMeal = (meal: any, mealId: string) => {
    setSelectedLoggedMealId(mealId);
    setLastLoggedMeal(toParsedMacroAnalysis(meal));
  };

  const runNutritionImageAnalysis = async (mealFile: SelectedImageFile, mealDescription?: string, ingredientFile?: SelectedImageFile | null) => {
    const todayKey = toDateKeyLocal(new Date());
    if (selectedDate > todayKey) {
      setAnalysisResult(t('nutritionLogger.futureDateLocked'));
      setLastLoggedMeal(null);
      return;
    }
    const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').toLowerCase();
    const locale: 'sv' | 'en' = activeLanguage.startsWith('sv') ? 'sv' : 'en';
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setPendingAnalysisReview(null);
    setIsAnalysisReviewModalVisible(false);
    setLastLoggedMeal(null);
    try {
      const data = await NutritionAnalyze({
        uri: mealFile.uri,
        name: mealFile.name,
        type: mealFile.type,
        mealDescription,
        ingredientListUri: ingredientFile?.uri,
        ingredientListName: ingredientFile?.name,
        ingredientListType: ingredientFile?.type,
        locale,
        prompt: trackingPromptForAI,
        trackingTargets: activeTrackingTargetsForAI,
      });
      if (data?.type === 'error') {
        handleNutritionError({
          data,
          t,
          setAnalysisResult,
          setPendingAnalysisReview,
          setIsAnalysisReviewModalVisible,
        });
        return;
      }
      const result = extractAndValidateNutritionAnalysis({
        data,
        t,
        activeTrackingKeys,
        setAnalysisResult,
        setPendingAnalysisReview,
        setIsAnalysisReviewModalVisible,
        setLastLoggedMeal,
      });
      if (!result) return;
      setPendingAnalysisReview({
        analysis: result.analysis,
        weeklyTrackingSignals: result.mealWeeklyTrackingSignals,
        detectedDrinks: (data.detectedDrinks ?? []).map(drink => ({
          ...drink,
          confirmed: false,
        })),
        evidence: result.evidence,
        aiDescription: result.aiResponseDescription,
        evidenceMessage: result.evidenceMessage,
        statusMessage: t('nutritionLogger.analysisReadyToSave'),
      });
      setAnalysisResult(t('nutritionLogger.analysisReadyToSave'));
      setIsPackagingModalVisible(false);
      setPackagingMealImage(null);
      requestAnimationFrame(() => {
        setIsAnalysisReviewModalVisible(true);
      });
    } catch (err) {
      console.error('Error analyzing image:', err);
      const errMsg = err instanceof Error ? err.message : '';
      if (errMsg.toLowerCase().includes('socket hang up')) {
        handleSocketError({
          t,
          setAnalysisResult,
          setPendingAnalysisReview,
          setIsAnalysisReviewModalVisible,
          setLastLoggedMeal,
        });
      } else {
        handleGeneralError({
          t,
          setAnalysisResult,
          setPendingAnalysisReview,
          setIsAnalysisReviewModalVisible,
          setLastLoggedMeal,
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelected = (file: SelectedImageFile) => {
    const todayKey = toDateKeyLocal(new Date());
    if (selectedDate > todayKey) {
      setAnalysisResult(t('nutritionLogger.futureDateLocked'));
      return;
    }
    setMealTime(new Date());
    setPackagingMealImage(file);
    setIsPackagingModalVisible(true);
  };

  const handleAnalyzePackaging = (mealFile: SelectedImageFile, mealDescription: string, ingredientFile: SelectedImageFile | null) => {
    lastAnalyzedFilesRef.current = {
      mealFile,
      mealDescription,
      ingredientFile,
    };
    //setIsPackagingModalVisible(false);
    //setPackagingMealImage(null);
    runNutritionImageAnalysis(mealFile, mealDescription || undefined, ingredientFile).catch(console.error);
  };

  const handleClosePackagingModal = useCallback(() => {
    setIsPackagingModalVisible(false);
    setPackagingMealImage(null);
  }, []);

  const handleReAnalyze = useCallback(() => {
    const last = lastAnalyzedFilesRef.current;
    if (!last) return;
    closeAnalysisReviewModal();
    runNutritionImageAnalysis(last.mealFile, last.mealDescription || undefined, last.ingredientFile).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeAnalysisReviewModal]);

  const summary = dailyNutritionTracking[selectedDate];
  const drinks = dailyDrinkTracking[selectedDate] ?? [];
  const todayKey = toDateKeyLocal(new Date());
  const isFutureSelectedDate = selectedDate > todayKey;

  const recentMeals = useMemo<RecentMealOption[]>(
    () =>
      Object.entries(dailyNutritionTracking)
        .flatMap(([dateKey, daySummary]) => {
          const meals = Array.isArray(daySummary?.meals) ? daySummary.meals : [];
          return meals.map((meal, index) => ({
            id: typeof meal?.id === 'string' ? meal.id : `${dateKey}-${index}`,
            date: dateKey,
            meal,
            mealName: getNormalizedMealName(meal, t('nutritionLogger.unnamedMeal')),
            sortOrder: meals.length - index,
          }));
        })
        .sort((left, right) => {
          if (left.date !== right.date) {
            return right.date.localeCompare(left.date);
          }
          return right.sortOrder - left.sortOrder;
        })
        .filter((meal, index, allMeals) => {
          const mealCalories = roundToOneDecimal(typeof meal.meal?.calories === 'number' ? meal.meal.calories : 0);
          const mealFiber = roundToOneDecimal(typeof meal.meal?.fiber === 'number' ? meal.meal.fiber : 0);
          const uniquenessKey = `${meal.mealName.toLowerCase()}|${mealCalories}|${mealFiber}`;
          return (
            index ===
            allMeals.findIndex(candidate => {
              const candidateCalories = roundToOneDecimal(typeof candidate.meal?.calories === 'number' ? candidate.meal.calories : 0);
              const candidateFiber = roundToOneDecimal(typeof candidate.meal?.fiber === 'number' ? candidate.meal.fiber : 0);
              return `${candidate.mealName.toLowerCase()}|${candidateCalories}|${candidateFiber}` === uniquenessKey;
            })
          );
        })
        .slice(0, 20),
    [dailyNutritionTracking, t]
  );

  const copyMealSheetSnapPoints = useMemo(() => ['45%', '75%'], []);

  const dailyFiberByType = useMemo(() => (summary ? sumTypedTotals(summary.meals, 'fiberByType') : {}), [summary]);
  const dailyFiberSubtypeTotals = useMemo(() => (summary ? sumTypedTotals(summary.meals, 'fiberSubtypeTotals') : {}), [summary]);
  const dailyPolyphenolByType = useMemo(() => (summary ? sumTypedTotals(summary.meals, 'polyphenolByType') : {}), [summary]);
  const dailyMineralsByType = useMemo(() => (summary ? sumTypedTotals(summary.meals, 'mineralsByType') : {}), [summary]);
  const dailyMineralConfidenceByType = useMemo(() => (summary ? mergeMineralConfidenceFromMeals(summary.meals) : {}), [summary]);
  const dailyVitaminsByType = useMemo(() => (summary ? sumTypedTotals(summary.meals, 'vitaminsByType') : {}), [summary]);
  const dailyAminoAcidsByType = useMemo(() => (summary ? sumTypedTotals(summary.meals, 'aminoAcidsByType') : {}), [summary]);
  const dailyMicrobiomeSupport = useMemo(() => (summary ? sumMicrobiomeSupport(summary.meals) : []), [summary]);

  const nutritionPlanTipProgressByPeriod = useMemo(() => {
    const byPeriod = (period: NutritionTargetPeriod) =>
      nutritionPlanTipProgress
        .filter(tipProgress => tipProgress.period === period)
        .sort((left, right) => {
          if (left.isFulfilled !== right.isFulfilled) {
            return left.isFulfilled ? -1 : 1;
          }
          if (left.progress !== right.progress) {
            return right.progress - left.progress;
          }
          return left.title.localeCompare(right.title);
        });
    return {
      daily: byPeriod('daily'),
      weekly: byPeriod('weekly'),
    };
  }, [nutritionPlanTipProgress]);

  useEffect(() => {
    handleTipCompletionTransitions({
      nutritionPlanTipProgress,
      previousFulfilledByKeyRef,
      hasInitializedFulfilledTrackingRef,
      pendingCompletionScrollTimeoutRef,
      pendingCompletionAnimTimeoutRef,
      onTipCompleted,
      tipRowPeriodByKeyRef,
      tipRowLocalYByKeyRef,
      fulfilledTipsSectionYRef,
      periodSectionYRef,
      animateTipCompletion,
      completionScrollDelayMs: COMPLETION_SCROLL_DELAY_MS,
      completionAnimationDelayAfterScrollMs: COMPLETION_ANIMATION_DELAY_AFTER_SCROLL_MS,
    });
  }, [animateTipCompletion, nutritionPlanTipProgress, onTipCompleted]);

  useEffect(() => {
    nutritionPlanTipProgress.forEach(tipProgress => {
      if (!tipProgress.isFulfilled) return;
      if (tipProgress.period === 'daily') {
        claimNutritionTipCompletionXP?.({
          claimKey: `${tipProgress.tipId}|daily|${selectedDate}`,
          tipId: tipProgress.tipId,
          period: 'daily',
          periodKey: selectedDate,
          amount: XP_FOR_NUTRITION_TIP_DAILY_COMPLETION,
        });
      }
      if (tipProgress.period === 'weekly') {
        claimNutritionTipCompletionXP?.({
          claimKey: `${tipProgress.tipId}|weekly|${weekStartKey}`,
          tipId: tipProgress.tipId,
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
          disabled={isFutureSelectedDate}
          style={styles.imagePickerButton}
          label={t('nutritionLogger.packageFlowAnalyze')}
          glow
        />
        <View style={styles.copyMealLinkContainer}>
          <DiscreetButton
            onPress={handleOpenCopyMealModal}
            title={t('nutritionLogger.copyMealLink')}
            disabled={isFutureSelectedDate || recentMeals.length === 0}
          />
        </View>
        {isFutureSelectedDate && (
          <ThemedText
            type="caption"
            style={[
              styles.futureDateHint,
              {
                color: colors.textMuted,
              },
            ]}
          >
            {t('nutritionLogger.futureDateLocked')}
          </ThemedText>
        )}
        {lastLoggedMeal && (
          <Card
            style={{
              borderRadius: globalStyles.borders.borderRadius,
            }}
          >
            <ThemedText type="title3">
              {t('nutritionLogger.mealTitleWithName', {
                name: lastLoggedMeal.mealName,
              })}
            </ThemedText>
            <NutritionBreakdown
              calories={lastLoggedMeal.calories}
              protein={lastLoggedMeal.protein}
              carbohydrates={lastLoggedMeal.carbohydrates}
              fat={lastLoggedMeal.fat}
              fiber={lastLoggedMeal.fiber}
              fiberByType={lastLoggedMeal.fiberByType}
              fiberSubtypeTotals={lastLoggedMeal.fiberSubtypeTotals}
              polyphenolByType={lastLoggedMeal.polyphenolByType}
              mineralsByType={lastLoggedMeal.mineralsByType}
              mineralsConfidenceByType={lastLoggedMeal.mineralsConfidenceByType}
              vitaminsByType={lastLoggedMeal.vitaminsByType}
              aminoAcidsByType={lastLoggedMeal.aminoAcidsByType}
              microbiomeSupport={lastLoggedMeal.microbiomeSupport}
              keyPrefix="meal"
            />
          </Card>
        )}
        {summary && (
          <Card
            style={{
              borderRadius: globalStyles.borders.borderRadius,
            }}
          >
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
              <NutritionBreakdown
                calories={summary.totals.calories}
                protein={roundToOneDecimal(summary.totals.protein)}
                carbohydrates={roundToOneDecimal(summary.totals.carbohydrates)}
                fat={roundToOneDecimal(summary.totals.fat)}
                fiber={summary.totals.fiber}
                fiberByType={dailyFiberByType}
                fiberSubtypeTotals={dailyFiberSubtypeTotals}
                polyphenolByType={dailyPolyphenolByType}
                mineralsByType={dailyMineralsByType}
                mineralsConfidenceByType={dailyMineralConfidenceByType}
                vitaminsByType={dailyVitaminsByType}
                aminoAcidsByType={dailyAminoAcidsByType}
                microbiomeSupport={dailyMicrobiomeSupport}
                keyPrefix="daily"
              />
            </Collapsible>
          </Card>
        )}
        {summary && summary.meals.length > 0 && (
          <LoggedMealsSection meals={summary.meals} onEdit={handleStartEditMeal} onDelete={handleRemoveMeal} onSelect={handleSelectLoggedMeal} />
        )}
        {drinks.length > 0 && <LoggedDrinksSection drinks={drinks} onEdit={handleStartEditDrink} onDelete={handleRemoveDrink} />}
        <NutritionPlanTargetsSection
          fulfilledTipsSectionYRef={fulfilledTipsSectionYRef}
          periodSectionYRef={periodSectionYRef}
          nutritionPlanTipProgressByPeriod={nutritionPlanTipProgressByPeriod}
          getCompletionAnimValue={getCompletionAnimValue}
          tipRowLocalYByKeyRef={tipRowLocalYByKeyRef}
          tipRowPeriodByKeyRef={tipRowPeriodByKeyRef}
        />
        <PackagingAnalysisModal
          visible={isPackagingModalVisible}
          initialMealImage={packagingMealImage}
          isAnalyzing={isAnalyzing}
          onClose={handleClosePackagingModal}
          onAnalyze={handleAnalyzePackaging}
        />
        <ThemedModal
          visible={isAnalysisReviewModalVisible}
          title={t('nutritionLogger.analysisReviewTitle')}
          onClose={closeAnalysisReviewModal}
          onSave={handleSaveAnalyzedMeal}
          onSaveDisabled={!pendingAnalysisReview?.analysis}
          okLabel={t('general.save')}
        >
          <ScrollView style={styles.analysisReviewScroll} contentContainerStyle={styles.analysisReviewContent} showsVerticalScrollIndicator>
            <View style={styles.mealTimeRow}>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('nutritionLogger.mealTime')}
              </ThemedText>
              <DateTimeInput
                value={mealTime}
                showTime={true}
                showDate={false}
                onChange={value => {
                  setMealTime(value);
                }}
              />
            </View>
            {pendingAnalysisReview?.statusMessage || analysisResult ? (
              <ThemedText type="defaultSemiBold" style={styles.analysisReviewStatus}>
                {pendingAnalysisReview?.statusMessage ?? analysisResult}
              </ThemedText>
            ) : null}
            {interpretationItems?.length ? (
              <View style={styles.analysisReviewSection}>
                <ThemedText type="label">AI Interpretation</ThemedText>
                {interpretationItems.map((item, index) => (
                  <ThemedText key={`interp-${item.slice(0, 32)}`} type="default" style={styles.analysisReviewBody}>
                    {`${index + 1}. ${item}`}
                  </ThemedText>
                ))}
                {(() => {
                  let confidenceColor = colors.textMuted;
                  if (pendingAnalysisReview?.evidence?.confidence === 'high') {
                    confidenceColor = colors.surfaceGreenBorder;
                  } else if (pendingAnalysisReview?.evidence?.confidence === 'medium') {
                    confidenceColor = colors.successColor;
                  } else if (pendingAnalysisReview?.evidence?.confidence === 'low') {
                    confidenceColor = colors.warmColor;
                  }
                  const confidenceKey = 'general.confidence.' + (pendingAnalysisReview?.evidence?.confidence ?? 'unknown');
                  const confidenceText = t('general.confidence.label') + ': ' + t(confidenceKey);
                  return (
                    <ThemedText
                      type="caption"
                      style={[
                        styles.analysisReviewEvidence,
                        styles.analysisInterpretationMeta,
                        {
                          color: confidenceColor,
                        },
                      ]}
                    >
                      {confidenceText}
                    </ThemedText>
                  );
                })()}
              </View>
            ) : null}
            {lastAnalyzedFilesRef.current ? (
              <Pressable onPress={handleReAnalyze} disabled={isAnalyzing}>
                <ThemedText type="default" style={reAnalyzeTextStyle}>
                  {`${t('general.reAnalyzePrompt.prefix')} `}
                  <ThemedText type="defaultSemiBold" style={reAnalyzeHighlightStyle}>
                    {t('general.reAnalyzePrompt.correct')}
                  </ThemedText>
                  {`${t('general.reAnalyzePrompt.question')} `}
                  <ThemedText type="defaultSemiBold" style={reAnalyzePrefixStyle}>
                    {t('general.reAnalyzePrompt.rePrefix')}
                  </ThemedText>
                  <ThemedText type="defaultSemiBold" style={reAnalyzeHighlightStyle}>
                    {t('general.reAnalyzePrompt.analyze')}
                  </ThemedText>
                  {t('general.reAnalyzePrompt.suffix') ? ` ${t('general.reAnalyzePrompt.suffix')}` : ''}
                </ThemedText>
              </Pressable>
            ) : null}
            {pendingAnalysisReview?.detectedDrinks.length ? (
              <View style={styles.analysisReviewSection}>
                <ThemedText type="title3">{t('nutritionLogger.detectedDrinksTitle')}</ThemedText>
                {pendingAnalysisReview.detectedDrinks.map((drink, index) => {
                  const drinkImage = getDrinkImage(drink.type);

                  console.log('[Drink image]', {
                    type: drink.type,
                    name: drink.name,
                    image: drinkImage,
                  });

                  return (
                    <Card key={`${drink.type}-${drink.name}-${index}`} style={styles.detectedDrinkCard}>
                      <View style={styles.detectedDrinkHeader}>
                        <Image source={drinkImage} style={styles.detectedDrinkImage} resizeMode="contain" />
                        <View style={styles.detectedDrinkInfo}>
                          <ThemedText type="defaultSemiBold">{drink.name}</ThemedText>
                          <ThemedText type="caption" style={{ color: colors.textMuted }}>
                            {[
                              drink.amountMl ? `${Math.round(drink.amountMl)} ml` : null,
                              drink.sugarFree === true ? t('nutritionLogger.sugarFree') : null,
                              drink.caffeinated === true ? t('nutritionLogger.caffeine') : null,
                              isAlcohol(drink.type) ? t('nutritionLogger.alcohol') : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </ThemedText>
                        </View>
                        <AddButton
                          allowToggle
                          added={drink.confirmed}
                          onClick={() => handleToggleDrinkConfirmation(index)}
                          accessibilityLabel={drink.confirmed ? 'common.confirmed' : 'common.confirm'}
                        />
                      </View>
                    </Card>
                  );
                })}
              </View>
            ) : null}
            {pendingAnalysisReview?.analysis ? (
              <View style={styles.analysisReviewSection}>
                <ThemedText type="label">{t('nutritionLogger.analysisReviewNutritionPreviewTitle')}</ThemedText>
                <Card
                  style={{
                    borderRadius: globalStyles.borders.borderRadius,
                  }}
                >
                  <ThemedText type="title3">
                    {t('nutritionLogger.mealTitleWithName', {
                      name: pendingAnalysisReview.analysis.mealName,
                    })}
                  </ThemedText>
                  <NutritionBreakdown
                    calories={pendingAnalysisReview.analysis.calories}
                    protein={pendingAnalysisReview.analysis.protein}
                    carbohydrates={pendingAnalysisReview.analysis.carbohydrates}
                    fat={pendingAnalysisReview.analysis.fat}
                    fiber={pendingAnalysisReview.analysis.fiber}
                    fiberByType={pendingAnalysisReview.analysis.fiberByType}
                    fiberSubtypeTotals={pendingAnalysisReview.analysis.fiberSubtypeTotals}
                    polyphenolByType={pendingAnalysisReview.analysis.polyphenolByType}
                    mineralsByType={pendingAnalysisReview.analysis.mineralsByType}
                    mineralsConfidenceByType={pendingAnalysisReview.analysis.mineralsConfidenceByType}
                    vitaminsByType={pendingAnalysisReview.analysis.vitaminsByType}
                    aminoAcidsByType={pendingAnalysisReview.analysis.aminoAcidsByType}
                    microbiomeSupport={pendingAnalysisReview.analysis.microbiomeSupport}
                    keyPrefix="review"
                  />
                </Card>
              </View>
            ) : null}
          </ScrollView>
        </ThemedModal>
        <ThemedModal visible={isEditMealModalVisible} title={t('nutritionLogger.editMealTitle')} onClose={handleCloseEditMealModal} onSave={handleSaveMeal}>
          <View style={styles.editEntryModalContent}>
            <LabeledInput
              label={t('nutritionLogger.mealNameLabel')}
              value={editingMealName}
              onChangeText={setEditingMealName}
              autoCapitalize="sentences"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.editTime}>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('nutritionLogger.mealTime')}
              </ThemedText>
              <DateTimeInput value={editingMealTime} showTime showDate={false} onChange={setEditingMealTime} />
            </View>
          </View>
        </ThemedModal>
        <ThemedModal visible={isEditDrinkModalVisible} title={t('nutritionLogger.editDrinkTitle')} onClose={handleCloseEditDrinkModal} onSave={handleSaveDrink}>
          <View style={styles.editEntryModalContent}>
            <LabeledInput
              label={t('nutritionLogger.drinkNameLabel')}
              value={editingDrinkName}
              onChangeText={setEditingDrinkName}
              autoCapitalize="sentences"
              autoCorrect={false}
              autoFocus
            />
            <View style={styles.editTime}>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('nutritionLogger.drinkTime')}
              </ThemedText>
              <DateTimeInput value={editingDrinkTime} showTime showDate={false} onChange={setEditingDrinkTime} />
            </View>
          </View>
        </ThemedModal>
        <CopyMealBottomSheet
          copyMealBottomSheetRef={copyMealBottomSheetRef}
          copyMealSheetSnapPoints={copyMealSheetSnapPoints}
          BottomSheetOverlayContainer={BottomSheetOverlayContainer}
          colors={colors}
          styles={styles}
          t={t}
          recentMeals={recentMeals}
          handleCopyMeal={handleCopyMeal}
          roundToOneDecimal={roundToOneDecimal}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imagePickerButton: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  copyMealLinkContainer: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  futureDateHint: {
    textAlign: 'center',
    marginTop: -6,
    marginBottom: 12,
  },
  analysisReviewScroll: {
    maxHeight: 420,
    width: '100%',
  },
  analysisReviewContent: {
    gap: 12,
    paddingBottom: 8,
  },
  mealTimeRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 0,
    marginBottom: 4,
  },
  mealTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  analysisReviewStatus: {
    marginBottom: 4,
  },
  analysisReviewSection: {
    gap: 6,
  },
  analysisReviewBody: {
    lineHeight: 20,
  },
  analysisReviewEvidence: {
    lineHeight: 18,
  },
  analysisInterpretationMeta: {
    marginTop: 2,
    opacity: 0.9,
  },
  reAnalyzeText: {
    marginTop: 8,
  },
  reAnalyzeTextDisabled: {
    opacity: 0.5,
  },
  reAnalyzePrefix: {},
  reAnalyzeHighlight: {},
  copyMealModalContent: {
    width: '100%',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 50,
  },
  copyMealSheetTitle: {
    paddingTop: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  copyMealModalScroll: {
    width: '100%',
  },
  copyMealOption: {
    width: '100%',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 1,
  },
  copyMealStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  copyMealOptionName: {
    flex: 1,
    marginRight: 8,
  },
  copyMealStatsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  copyMealStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyMealStatText: {
    fontSize: 13,
  },
  copyMealEmptyText: {
    textAlign: 'center',
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
  detectedDrinkCard: {
    padding: 12,
  },
  detectedDrinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detectedDrinkImage: {
    width: 64,
    height: 64,
  },
  detectedDrinkInfo: {
    flex: 1,
    gap: 2,
  },
  editEntryModalContent: {
    width: '100%',
    gap: 16,
  },
  editTime: {
    alignItems: 'center',
    gap: 2,
  },
});

export default NutritionLoggerTab;
