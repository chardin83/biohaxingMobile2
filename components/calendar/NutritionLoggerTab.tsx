import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Image, KeyboardAvoidingView, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';

import type { MealEntry, NutritionEntry, NutritionTrackingContribution, TipProgressItem } from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { globalStyles } from '@/app/theme/globalStyles';
import { XP_FOR_NUTRITION_TIP_DAILY_COMPLETION, XP_FOR_NUTRITION_TIP_WEEKLY_COMPLETION } from '@/constants/XP';
import { useNutritionPlanProgress } from '@/hooks/useNutritionPlanProgress';
import { getDrinkImage } from '@/locales/drinkCatalog';
import { tips } from '@/locales/tips';
import { type DetectedDrink, isAlcohol, NutritionAnalyze } from '@/services/gptServices';
import { MicrobiomeSupportEntry } from '@/types/microbiome';
import { type NutritionTargetPeriod } from '@/types/nutrition/nutritionTargets';
import {
  type ConfidenceLevel,
  extractAndValidateNutritionAnalysis,
  type ParsedMacroAnalysis,
  parseNumberValue,
  roundToOneDecimal,
  type WeeklyTrackingSignals,
} from '@/utils/analyzeNutrition';
import { toDateKey, toRecordedAt } from '@/utils/dateUtils';

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
    weekStartISO: toDateKey(weekStartDate),
    weekEndISO: toDateKey(weekEndDate),
  };
};

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

const getNutritionEntryName = (entry: NutritionEntry, fallbackName: string): string =>
  typeof entry.name === 'string' && entry.name.trim().length > 0 ? entry.name : fallbackName;

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
    addNutritionEntry,
    updateNutritionEntry,
    removeNutritionEntry,
    weeklyNutritionTracking,
    setWeeklyNutritionTracking,
    dailyDrinkTracking,
    addDrinkEntry,
    updateDrinkEntry,
    removeDrinkEntry,
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

  const findWeeklyTrackingContribution = (nutritionEntryId: string, dateKey: string): NutritionTrackingContribution | undefined => {
    const { weekStartISO } = getWeekBoundsFromDateKey(dateKey);

    return weeklyNutritionTracking[weekStartISO]?.find(contribution => contribution.nutritionEntryId === nutritionEntryId);
  };

  const addWeeklyTrackingContribution = (nutritionEntryId: string, dateKey: string, signals: WeeklyTrackingSignals) => {
    const filteredSignals = Object.fromEntries(Object.entries(signals).filter(([key]) => activeTrackingKeys.has(key)));

    if (Object.keys(filteredSignals).length === 0) {
      return;
    }

    const { weekStartISO } = getWeekBoundsFromDateKey(dateKey);

    const contribution: NutritionTrackingContribution = {
      nutritionEntryId,
      date: dateKey,
      signals: filteredSignals,
    };

    setWeeklyNutritionTracking(previous => ({
      ...previous,
      [weekStartISO]: [...(previous[weekStartISO] ?? []), contribution],
    }));
  };

  const removeWeeklyTrackingContribution = (nutritionEntryId: string, dateKey: string) => {
    const { weekStartISO } = getWeekBoundsFromDateKey(dateKey);

    setWeeklyNutritionTracking(previous => {
      const contributions = previous[weekStartISO] ?? [];

      const updatedContributions = contributions.filter(contribution => contribution.nutritionEntryId !== nutritionEntryId);

      if (updatedContributions.length === contributions.length) {
        return previous;
      }

      const next = { ...previous };

      if (updatedContributions.length === 0) {
        delete next[weekStartISO];
      } else {
        next[weekStartISO] = updatedContributions;
      }

      return next;
    });
  };

  const handleRemoveMeal = (mealId: string) => {
    if (mealId === selectedLoggedMealId) {
      setSelectedLoggedMealId(null);
      setLastLoggedMeal(null);
    }

    removeNutritionEntry(selectedDate, mealId);
    removeWeeklyTrackingContribution(mealId, selectedDate);
  };

  const handleRemoveDrink = (drinkId: string) => {
    removeDrinkEntry(selectedDate, drinkId);
  };

  const handleStartEditMeal = (entryId: string, entryName: string) => {
    const entry = dailyNutritionTracking[selectedDate]?.entries.find(item => item.id === entryId);
    if (!entry) return;
    setEditingMealId(entryId);
    setEditingMealName(entryName);
    setEditingMealTime(new Date(entry.recordedAt));
    setIsEditMealModalVisible(true);
  };

  const handleCloseEditMealModal = () => {
    setIsEditMealModalVisible(false);
    setEditingMealId(null);
    setEditingMealName('');
    setEditingMealTime(new Date());
  };
  const handleSaveMeal = () => {
    if (!editingMealId) {
      handleCloseEditMealModal();
      return;
    }

    const name = editingMealName.trim() || t('nutritionLogger.unnamedMeal');

    const recordedAt = toRecordedAt(selectedDate, editingMealTime);

    updateNutritionEntry(selectedDate, editingMealId, {
      name,
      recordedAt,
    });

    if (editingMealId === selectedLoggedMealId) {
      setLastLoggedMeal(prev =>
        prev
          ? {
              ...prev,
              mealName: name,
            }
          : prev
      );
    }

    handleCloseEditMealModal();
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

    if (!name) {
      return;
    }

    const recordedAt = toRecordedAt(selectedDate, editingDrinkTime);

    updateDrinkEntry(selectedDate, editingDrinkId, {
      name,
      recordedAt,
    });

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

  const handleSaveAnalyzedMeal = () => {
    if (!pendingAnalysisReview?.analysis) {
      closeAnalysisReviewModal();
      return;
    }

    const analysis = pendingAnalysisReview.analysis;
    const { mealName, ...nutrition } = analysis;
    const recordedAt = toRecordedAt(selectedDate, mealTime);

    const confirmedDrinks = pendingAnalysisReview.detectedDrinks.filter(drink => drink.confirmed).map(({ confirmed: _confirmed, ...drink }) => drink);

    const newEntry = addNutritionEntry(selectedDate, {
      type: 'meal',
      recordedAt,
      name: mealName?.trim() || t('nutritionLogger.unnamedMeal'),
      ...nutrition,
    });

    const nutritionEntryId = newEntry.id;

    addWeeklyTrackingContribution(nutritionEntryId, selectedDate, pendingAnalysisReview.weeklyTrackingSignals);

    setSelectedLoggedMealId(nutritionEntryId);

    confirmedDrinks.forEach(drink => {
      addDrinkEntry(selectedDate, {
        nutritionEntryId,
        ...drink,
        recordedAt,
        source: 'meal_analysis',
      });
    });

    setLastLoggedMeal(analysis);
    setAnalysisResult('✅ Måltid loggad och analyserad!');
    triggerLightHaptic();
    closeAnalysisReviewModal();
  };

  const toParsedMacroAnalysis = (entry: NutritionEntry): ParsedMacroAnalysis => ({
    mealName: getNutritionEntryName(entry, t('nutritionLogger.unnamedMeal')),
    protein: coerceNumber(entry.protein),
    calories: coerceNumber(entry.calories),
    carbohydrates: coerceNumber(entry.carbohydrates),
    fat: coerceNumber(entry.fat),
    fiber: coerceNumber(entry.fiber),
    fiberByType: coerceObject(entry.fiberByType),
    fiberSubtypeTotals: coerceObject(entry.fiberSubtypeTotals),
    polyphenolByType: coerceObject(entry.polyphenolByType),
    mineralsByType: coerceObject(entry.mineralsByType),
    mineralsConfidenceByType: coerceObject(entry.mineralsConfidenceByType),
    vitaminsByType: coerceObject(entry.vitaminsByType),
    aminoAcidsByType: coerceObject(entry.aminoAcidsByType),
    microbiomeSupport: coerceArray(entry.microbiomeSupport),
  });

  const handleCopyMeal = (sourceEntry: MealEntry) => {
    const recordedAt = toRecordedAt(selectedDate, new Date(sourceEntry.recordedAt));

    const copiedEntry = addNutritionEntry(selectedDate, {
      ...sourceEntry,
      recordedAt,
    });

    const sourceContribution = findWeeklyTrackingContribution(sourceEntry.id, toDateKey(new Date(sourceEntry.recordedAt)));

    if (sourceContribution) {
      addWeeklyTrackingContribution(copiedEntry.id, selectedDate, sourceContribution.signals);
    }

    setSelectedLoggedMealId(copiedEntry.id);
    setLastLoggedMeal(toParsedMacroAnalysis(copiedEntry));

    triggerLightHaptic();
    handleCloseCopyMealModal();
  };

  const handleSelectLoggedMeal = (entry: NutritionEntry, entryId: string) => {
    setSelectedLoggedMealId(entryId);
    setLastLoggedMeal(toParsedMacroAnalysis(entry));
  };

  const runNutritionImageAnalysis = async (mealFile: SelectedImageFile, mealDescription?: string, ingredientFile?: SelectedImageFile | null) => {
    const todayKey = toDateKey(new Date());
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
    const todayKey = toDateKey(new Date());
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
  const todayKey = toDateKey(new Date());
  const isFutureSelectedDate = selectedDate > todayKey;

  const RECENT_MEAL_LIMIT = 20;

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

  const copyMealSheetSnapPoints = useMemo(() => ['45%', '75%'], []);

  const dailyFiberByType = useMemo(() => (summary ? sumTypedTotals(summary.entries, 'fiberByType') : {}), [summary]);
  const dailyFiberSubtypeTotals = useMemo(() => (summary ? sumTypedTotals(summary.entries, 'fiberSubtypeTotals') : {}), [summary]);
  const dailyPolyphenolByType = useMemo(() => (summary ? sumTypedTotals(summary.entries, 'polyphenolByType') : {}), [summary]);
  const dailyMineralsByType = useMemo(() => (summary ? sumTypedTotals(summary.entries, 'mineralsByType') : {}), [summary]);
  const dailyMineralConfidenceByType = useMemo(() => (summary ? mergeMineralConfidenceFromEntries(summary.entries) : {}), [summary]);
  const dailyVitaminsByType = useMemo(() => (summary ? sumTypedTotals(summary.entries, 'vitaminsByType') : {}), [summary]);
  const dailyAminoAcidsByType = useMemo(() => (summary ? sumTypedTotals(summary.entries, 'aminoAcidsByType') : {}), [summary]);
  const dailyMicrobiomeSupport = useMemo(() => (summary ? sumMicrobiomeSupport(summary.entries) : []), [summary]);

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
        {summary && summary.entries.length > 0 && (
          <LoggedMealsSection meals={summary.entries} onEdit={handleStartEditMeal} onDelete={handleRemoveMeal} onSelect={handleSelectLoggedMeal} />
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
