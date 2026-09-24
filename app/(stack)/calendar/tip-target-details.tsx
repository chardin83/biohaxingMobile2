import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import {
  DailyNutritionSummary,
  NutritionEntry,
  NutritionTrackingContribution,
  WeeklyNutritionValue,
  WeeklyTrackingItem,
} from '@/app/context/storage/nutrition/nutritionTypes';
import { useStorage } from '@/app/context/StorageContext';
import { Supplement } from '@/app/domain/Supplement';
import { Collapsible } from '@/components/Collapsible';
import FoodPortionBottomSheet from '@/components/FoodPortionBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { useBottomSheetDesign } from '@/components/ui/BottomSheetDesign';
import Container from '@/components/ui/Container';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { isAminoAcidTargetTag } from '@/constants/aminoAcids';
import { isFiberTargetTag } from '@/constants/fiber';
import { isMineralTargetTag } from '@/constants/minerals';
import { isPolyphenolTargetTag } from '@/constants/polyphenols';
import { isVitaminTargetTag } from '@/constants/vitamins';
import { useSupplementMap } from '@/locales/supplements';
import { getTipTargetIconName, type NutrientTag, tips } from '@/locales/tips';
import { toGrams, toMicrograms, toMilligrams } from '@/services/targetProgress/nutritionTargetProgress';
import { FOOD_IMAGES, FOOD_NUTRIENT_PROFILES, FoodNutrientProfile, type FoodServing } from '@/types/nutrition/foodCatalog';
import { type NutritionTargetUnit } from '@/types/nutrition/nutritionTargets';
import { formatMonthDayRange, fromDateKey, toDateKey, toRecordedAt } from '@/utils/dateUtils';
import { formatWithUnit } from '@/utils/formatters';
import { getNutritionTargetMedalEmoji, getNutritionTargetMedalType } from '@/utils/medals';

type ContributingNutritionEntry = {
  id: string;
  dateKey: string;
  name: string;
  amount: number;
  trackedItems?: string[];
};

type RouteParamValue = string | string[] | undefined;

const parseNumber = (value: RouteParamValue): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

const parseCommaSeparated = (value: RouteParamValue): string[] => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  return raw
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
};

const parseTargetUnit = (value: RouteParamValue): NutritionTargetUnit | null => {
  const raw = (Array.isArray(value) ? value[0] : value)?.toLowerCase();
  if (raw === 'mg' || raw === 'g' || raw === 'μg' || raw === 'plants' || raw === 'items' || raw === 'count') {
    return raw;
  }
  return null;
};

const isSupplementEligibleUnit = (unit: NutritionTargetUnit): unit is 'mg' | 'g' | 'μg' => unit === 'mg' || unit === 'g' || unit === 'μg';

const addDays = (dateKey: string, days: number): string => {
  const nextDate = fromDateKey(dateKey);
  if (Number.isNaN(nextDate.getTime())) {
    return toDateKey(new Date());
  }

  nextDate.setDate(nextDate.getDate() + days);
  return toDateKey(nextDate);
};

const formatDateLabel = (dateKey: string, language: string): string => {
  const date = fromDateKey(dateKey);
  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return date.toLocaleDateString(language, {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getWeekStartMonday = (date: Date): Date => {
  const result = new Date(date);
  const diff = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const getWeekBoundsFromDateKey = (dateKey: string): { weekStartKey: string; weekEndKey: string } => {
  const weekStart = getWeekStartMonday(fromDateKey(dateKey));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    weekStartKey: toDateKey(weekStart),
    weekEndKey: toDateKey(weekEnd),
  };
};

const getDateKeysInRange = (startKey: string, endKey: string): string[] => {
  const keys: string[] = [];
  let cursor = startKey;

  while (cursor <= endKey) {
    keys.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return keys;
};

const buildDailySummary = (entries: NutritionEntry[], selectedDate: string): DailyNutritionSummary => {
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
    protein: Number(rawTotals.protein.toFixed(1)),
    calories: Number(rawTotals.calories.toFixed(1)),
    carbohydrates: Number(rawTotals.carbohydrates.toFixed(1)),
    fat: Number(rawTotals.fat.toFixed(1)),
    fiber: Number(rawTotals.fiber.toFixed(1)),
  };

  return {
    date: selectedDate,
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
const getDiscreteTrackingAmounts = (
  trackingValue?: WeeklyNutritionValue
): {
  foodAmount: number;
  supplementAmount: number;
} => {
  let foodAmount = 0;

  if (typeof trackingValue === 'number') {
    foodAmount = trackingValue;
  } else if (Array.isArray(trackingValue)) {
    foodAmount = trackingValue.length;
  }

  return {
    foodAmount: Math.max(0, foodAmount),
    supplementAmount: 0,
  };
};

const calculateIntakeForTarget = (
  targetTag: string,
  targetUnit: NutritionTargetUnit,
  nutritionSummaries: Array<DailyNutritionSummary | undefined>,
  supplementsForPeriod: Supplement[],
  trackingValue?: WeeklyNutritionValue
): {
  foodAmount: number;
  supplementAmount: number;
} => {
  if (targetUnit === 'items' || targetUnit === 'count' || targetUnit === 'plants') {
    return getDiscreteTrackingAmounts(trackingValue);
  }

  if (!isSupplementEligibleUnit(targetUnit)) {
    return {
      foodAmount: 0,
      supplementAmount: 0,
    };
  }

  const foodAmount = nutritionSummaries.reduce(
    (sum, summary) =>
      sum + (summary?.entries ?? []).reduce((entrySum, entry) => entrySum + getNutritionEntryContributionForTarget(entry, targetTag, targetUnit), 0),
    0
  );

  const supplementAmount = supplementsForPeriod.reduce(
    (sum, supplement) => sum + getSupplementContributionForTargetUnit(Number(supplement.quantity) || 0, (supplement.unit || '').toLowerCase(), targetUnit),
    0
  );

  return {
    foodAmount: Math.max(0, foodAmount),
    supplementAmount: Math.max(0, supplementAmount),
  };
};
const aggregateTrackingValue = (contributions: NutritionTrackingContribution[], trackingKey: string): WeeklyNutritionValue | undefined => {
  const values = contributions.map(contribution => contribution.signals[trackingKey]).filter((value): value is WeeklyNutritionValue => value !== undefined);

  if (values.length === 0) {
    return undefined;
  }

  if (values.every((value): value is number => typeof value === 'number')) {
    return values.reduce((sum, value) => sum + value, 0);
  }

  const items = values.flatMap(value => (Array.isArray(value) ? value : []));

  const uniqueItems = new Map<string, WeeklyTrackingItem>();

  items.forEach(item => {
    const key = item.en.trim().toLowerCase();

    if (key) {
      uniqueItems.set(key, item);
    }
  });

  return Array.from(uniqueItems.values());
};
const getSupplementContributionForTargetUnit = (quantity: number, unit: string, targetUnit: 'mg' | 'g' | 'μg'): number => {
  if (!quantity) return 0;
  if (targetUnit === 'mg') return toMilligrams(quantity, unit) ?? 0;
  if (targetUnit === 'g') return toGrams(quantity, unit) ?? 0;
  return toMicrograms(quantity, unit) ?? 0;
};

const getTargetValueFromMilligrams = (value: number, targetUnit: NutritionTargetUnit): number => (targetUnit === 'μg' ? value * 1000 : value);

const getNutritionEntryContributionForTarget = (entry: NutritionEntry, targetTag: string, targetUnit: NutritionTargetUnit): number => {
  if (targetUnit === 'items' || targetUnit === 'count' || targetUnit === 'plants') {
    return 0;
  }

  if (isMineralTargetTag(targetTag) && entry.mineralsByType?.[targetTag]) {
    return getTargetValueFromMilligrams(Number(entry.mineralsByType[targetTag]) || 0, targetUnit);
  }

  if (isVitaminTargetTag(targetTag) && entry.vitaminsByType?.[targetTag]) {
    return getTargetValueFromMilligrams(Number(entry.vitaminsByType[targetTag]) || 0, targetUnit);
  }

  if (isAminoAcidTargetTag(targetTag) && entry.aminoAcidsByType?.[targetTag]) {
    return getTargetValueFromMilligrams(Number(entry.aminoAcidsByType[targetTag]) || 0, targetUnit);
  }

  if (isFiberTargetTag(targetTag) && entry.fiberByType?.[targetTag]) {
    return Number(entry.fiberByType[targetTag]) || 0;
  }

  if (isPolyphenolTargetTag(targetTag) && entry.polyphenolByType?.[targetTag]) {
    return getTargetValueFromMilligrams(Number(entry.polyphenolByType[targetTag]) || 0, targetUnit);
  }

  return 0;
};

const getContributingNutritionEntriesForTarget = (
  entries: NutritionEntry[],
  selectedDateKey: string,
  targetTag: string,
  targetUnit: NutritionTargetUnit,
  t: (key: string) => string
): ContributingNutritionEntry[] =>
  entries
    .map(entry => ({
      id: entry.id,
      dateKey: selectedDateKey,
      name: entry.name?.trim() || t('nutritionLogger.unnamedEntry'),
      amount: getNutritionEntryContributionForTarget(entry, targetTag, targetUnit),
    }))
    .filter(entry => entry.amount > 0)
    .sort((left, right) => right.amount - left.amount);

const scaleFrom100 = (value: number | undefined, grams: number): number => {
  if (typeof value !== 'number') return 0;
  return Number(((value * grams) / 100).toFixed(3));
};

const getProfileValueForTag = (profile: FoodNutrientProfile | null, targetTag: string): number | undefined => {
  if (!profile || !targetTag) return undefined;
  if (isMineralTargetTag(targetTag)) return profile.mineralsByType?.[targetTag];
  if (isVitaminTargetTag(targetTag)) return profile.vitaminsByType?.[targetTag];
  if (isAminoAcidTargetTag(targetTag)) return profile.aminoAcidsByType?.[targetTag];
  if (isFiberTargetTag(targetTag)) return profile.fiberByType?.[targetTag];
  if (isPolyphenolTargetTag(targetTag)) return profile.polyphenolByType?.[targetTag];
  return undefined;
};

const scaleMapFrom100 = <K extends string>(map: Partial<Record<K, number>> | undefined, grams: number): Record<string, number> => {
  if (!map) return {};
  return Object.fromEntries(Object.entries(map as Record<string, number | undefined>).map(([key, value]) => [key, scaleFrom100(value, grams)]));
};

const isFoodProfileKey = (key: string): key is keyof typeof FOOD_NUTRIENT_PROFILES => key in FOOD_NUTRIENT_PROFILES;

const ContributingMealsSection = ({
  colors,
  t,
  contributingMeals,
  amountUnit,
  targetTagParam,
  targetLabel,
  emptyText,
  language,
}: {
  colors: any;
  t: (key: string) => string;
  contributingMeals: Array<{
    id: string;
    dateKey: string;
    name: string;
    amount: number;
    trackedItems?: string[];
  }>;
  amountUnit: string;
  targetTagParam: string;
  targetLabel: string;
  emptyText: string;
  language: string;
}) => {
  if (contributingMeals.length === 0) {
    return (
      <View style={[styles.mealsSection, { borderColor: colors.borderLight ?? colors.border }]}>
        <ThemedText type="title3" style={styles.supplementHeading}>
          {t('common:tip-target-details.meals.title')}
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textMuted }}>
          {emptyText}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.mealsSection, { borderColor: colors.borderLight ?? colors.border }]}>
      <ThemedText type="title3" style={styles.supplementHeading}>
        {t('common:tip-target-details.meals.title')}
      </ThemedText>
      <View style={styles.mealsList}>
        {contributingMeals.map(meal => (
          <View key={meal.id} style={styles.mealContributionCard}>
            <Collapsible
              title={meal.name}
              titleType="default"
              initialCollapsed
              rightContent={
                <ThemedText type="defaultSemiBold" style={styles.mealContributionAmount}>
                  {formatWithUnit(meal.amount, amountUnit, targetTagParam)}
                </ThemedText>
              }
              accessibilityLabel={meal.name}
            >
              <View style={styles.mealContributionDetails}>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {formatDateLabel(meal.dateKey, language)}
                </ThemedText>
                {meal.trackedItems && meal.trackedItems.length > 0 ? (
                  <View style={styles.mealContributionItems}>
                    {meal.trackedItems.map(item => (
                      <ThemedText key={`${meal.id}-${item}`} type="caption">
                        • {item}
                      </ThemedText>
                    ))}
                  </View>
                ) : (
                  <ThemedText type="caption">{`${formatWithUnit(meal.amount, amountUnit, targetTagParam)} ${targetLabel.toLowerCase()}`}</ThemedText>
                )}
              </View>
            </Collapsible>
          </View>
        ))}
      </View>
    </View>
  );
};

const PeriodNavigationSection = ({
  colors,
  t,
  periodLabel,
  canGoForward,
  previousAccessibilityLabel,
  nextAccessibilityLabel,
  onPrevious,
  onNext,
}: {
  colors: any;
  t: (key: string) => string;
  periodLabel: string;
  canGoForward: boolean;
  previousAccessibilityLabel: string;
  nextAccessibilityLabel: string;
  onPrevious: () => void;
  onNext: () => void;
}) => (
  <View style={[styles.dateSection, { borderColor: colors.borderLight ?? colors.border }]}>
    <ThemedText type="defaultSemiBold">{t('common:tip-target-details.date.title')}</ThemedText>
    <View style={styles.dateNavRow}>
      <TouchableOpacity onPress={onPrevious} accessibilityRole="button" accessibilityLabel={previousAccessibilityLabel}>
        <IconSymbol name="chevron.left" size={20} color={colors.primary} />
      </TouchableOpacity>
      <ThemedText type="default">{periodLabel}</ThemedText>
      <TouchableOpacity onPress={onNext} disabled={!canGoForward} accessibilityRole="button" accessibilityLabel={nextAccessibilityLabel}>
        <IconSymbol name="chevron.right" size={20} color={canGoForward ? colors.primary : colors.textMuted} />
      </TouchableOpacity>
    </View>
  </View>
);

const IntakeDetailsSection = ({
  colors,
  t,
  hasData,
  totalActual,
  foodActual,
  supplementActual,
  targetAmount,
  amountUnit,
  targetTagParam,
  noDataText,
}: {
  colors: any;
  t: (key: string) => string;
  hasData: boolean;
  totalActual: number;
  foodActual: number;
  supplementActual: number;
  targetAmount: number;
  amountUnit: string;
  targetTagParam: string;
  noDataText: string;
}) => (
  <View style={[styles.detailsSection, { borderColor: colors.borderLight ?? colors.border }]}>
    <ThemedText type="title3" style={styles.detailsHeading}>
      {t('common:tip-target-details.details.title')}
    </ThemedText>
    {hasData ? (
      <>
        <View style={styles.detailRow}>
          <ThemedText type="default">{t('common:tip-target-details.details.totalIntake')}</ThemedText>
          <ThemedText type="defaultSemiBold">{formatWithUnit(totalActual, amountUnit, targetTagParam)}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="default">{t('common:tip-target-details.details.fromFood')}</ThemedText>
          <ThemedText type="defaultSemiBold">{formatWithUnit(foodActual, amountUnit, targetTagParam)}</ThemedText>
        </View>
        <View style={styles.detailRow}>
          <ThemedText type="default">{t('common:tip-target-details.details.fromSupplements')}</ThemedText>
          <ThemedText type="defaultSemiBold">{formatWithUnit(supplementActual, amountUnit, targetTagParam)}</ThemedText>
        </View>
      </>
    ) : (
      <ThemedText type="caption" style={{ color: colors.textMuted }}>
        {noDataText}
      </ThemedText>
    )}
    <View style={styles.detailRow}>
      <ThemedText type="default">{t('common:tip-target-details.details.goal')}</ThemedText>
      <ThemedText type="defaultSemiBold">{formatWithUnit(targetAmount, amountUnit, targetTagParam)}</ThemedText>
    </View>
  </View>
);

const getCanGoForward = (
  isWeeklyTarget: boolean,
  selectedDateKey: string,
  today: string,
  selectedWeekStartKey: string,
  currentWeekStartKey: string
): boolean => {
  if (isWeeklyTarget) {
    return selectedWeekStartKey < currentWeekStartKey;
  }

  return selectedDateKey < today;
};

const getPeriodPresentation = ({
  isWeeklyTarget,
  selectedDateKey,
  selectedWeekStartKey,
  selectedWeekEndKey,
  language,
  t,
}: {
  isWeeklyTarget: boolean;
  selectedDateKey: string;
  selectedWeekStartKey: string;
  selectedWeekEndKey: string;
  language: string;
  t: (key: string) => string;
}) => {
  if (isWeeklyTarget) {
    return {
      periodLabel: formatMonthDayRange(fromDateKey(selectedWeekStartKey), fromDateKey(selectedWeekEndKey), language),
      previousPeriodLabel: t('common:tip-target-details.date.previousWeek'),
      nextPeriodLabel: t('common:tip-target-details.date.nextWeek'),
      noDataText: t('common:tip-target-details.details.noDataForWeek'),
      noContributingMealsText: t('common:tip-target-details.meals.noneContributedWeek'),
    };
  }

  return {
    periodLabel: formatDateLabel(selectedDateKey, language),
    previousPeriodLabel: t('common:tip-target-details.date.previousDay'),
    nextPeriodLabel: t('common:tip-target-details.date.nextDay'),
    noDataText: t('common:tip-target-details.details.noDataForDay'),
    noContributingMealsText: t('common:tip-target-details.meals.noneContributed'),
  };
};

export default function TipTargetDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const sheetDesign = useBottomSheetDesign(colors);
  const { t, i18n } = useTranslation();
  const supplementMap = useSupplementMap();
  const foodPortionBottomSheetRef = useRef<BottomSheetModal>(null);
  const medalInfoBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const [selectedFoodName, setSelectedFoodName] = useState<string>('');
  const [selectedFoodDetails, setSelectedFoodDetails] = useState<string>('');
  const [selectedFoodSourceKey, setSelectedFoodSourceKey] = useState<string>('');
  const [selectedFoodProfile, setSelectedFoodProfile] = useState<FoodNutrientProfile | null>(null);
  const [selectedFoodServings, setSelectedFoodServings] = useState<FoodServing[]>([]);
  const { dailyNutritionTracking, takenDates, weeklyNutritionTracking, setDailyNutritionTracking } = useStorage();
  const params = useLocalSearchParams<{
    tipId?: string;
    tipTitle?: string;
    targetLabel?: string;
    targetTag?: string;
    foodActual?: string;
    supplementActual?: string;
    targetAmount?: string;
    targetUnit?: string;
    targetPeriod?: string;
    dateKey?: string;
    targetSupplementIds?: string;
  }>();

  const tipId = params.tipId ?? '';
  const tipMeta = tips.find(candidate => candidate.id === tipId);
  const targetTagParam = (Array.isArray(params.targetTag) ? params.targetTag[0] : params.targetTag) ?? '';
  const selectedFoodImage: ImageSourcePropType | undefined = isFoodProfileKey(selectedFoodSourceKey)
    ? (FOOD_IMAGES[selectedFoodSourceKey] as ImageSourcePropType | undefined)
    : undefined;
  const targetSupplementIds = useMemo(() => new Set(parseCommaSeparated(params.targetSupplementIds)), [params.targetSupplementIds]);
  const listedSupplements = (tipMeta?.supplements ?? [])
    .filter(reference => (targetSupplementIds.size > 0 ? targetSupplementIds.has(reference.id) : true))
    .map(reference => supplementMap.get(reference.id))
    .filter((supplement): supplement is NonNullable<typeof supplement> => Boolean(supplement));
  const nutritionFoodItems = useMemo(() => {
    if (!tipMeta?.nutritionFoods?.length || !tipMeta.id) {
      return [] as { key: string; foodKey: string; name: string; details: string }[];
    }

    const matchingFoods = targetTagParam ? tipMeta.nutritionFoods.filter(food => food.nutrientTags?.includes(targetTagParam as NutrientTag)) : [];
    const foodsToRender = matchingFoods.length > 0 ? matchingFoods : tipMeta.nutritionFoods;

    return foodsToRender.map(food => {
      const itemKey = food.key;
      const detailKey = food.detailsKey ?? itemKey;
      const name = t(`tips:${tipMeta.id}.nutritionFoods.items.${itemKey}.name`, {
        defaultValue: t(`food:foods.${itemKey}.name`, { defaultValue: itemKey }),
      });
      const details = t(`tips:${tipMeta.id}.nutritionFoods.items.${detailKey}.details`, {
        defaultValue: '',
      });
      return {
        key: `${itemKey}:${detailKey}`,
        foodKey: itemKey,
        name,
        details,
      };
    });
  }, [t, tipMeta?.id, tipMeta?.nutritionFoods, targetTagParam]);
  const tipTitle = params.tipTitle ?? tipId;
  const targetLabel = params.targetLabel ?? '';
  const targetPeriod = (Array.isArray(params.targetPeriod) ? params.targetPeriod[0] : params.targetPeriod) ?? 'daily';
  const isWeeklyTarget = targetPeriod === 'weekly';
  const today = toDateKey(new Date());
  const initialDateKey = params.dateKey && params.dateKey.length > 0 ? params.dateKey : today;
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const selectedWeekBounds = useMemo(() => getWeekBoundsFromDateKey(selectedDateKey), [selectedDateKey]);
  const currentWeekStartKey = useMemo(() => getWeekBoundsFromDateKey(today).weekStartKey, [today]);
  const canGoForward = getCanGoForward(isWeeklyTarget, selectedDateKey, today, selectedWeekBounds.weekStartKey, currentWeekStartKey);
  const targetAmount = parseNumber(params.targetAmount);
  const targetUnit = parseTargetUnit(params.targetUnit) ?? 'mg';
  const selectedDateKeys = useMemo(
    () => (isWeeklyTarget ? getDateKeysInRange(selectedWeekBounds.weekStartKey, selectedWeekBounds.weekEndKey) : [selectedDateKey]),
    [isWeeklyTarget, selectedDateKey, selectedWeekBounds.weekEndKey, selectedWeekBounds.weekStartKey]
  );
  const selectedTrackingValue = useMemo(() => {
    if (!isWeeklyTarget) {
      return undefined;
    }

    const contributions = weeklyNutritionTracking[selectedWeekBounds.weekStartKey] ?? [];

    return aggregateTrackingValue(contributions, targetTagParam);
  }, [isWeeklyTarget, weeklyNutritionTracking, selectedWeekBounds.weekStartKey, targetTagParam]);

  const { foodAmount, supplementAmount } = useMemo(() => {
    const mealSummaries = selectedDateKeys.map(dateKey => dailyNutritionTracking[dateKey]);

    const supplementsForPeriod = selectedDateKeys.flatMap(dateKey => {
      const supplementsForDay = takenDates[dateKey] ?? [];

      const componentSupplements = supplementsForDay.flatMap(supplement => (supplement.components?.length ? supplement.components : [supplement]));

      return targetSupplementIds.size > 0 ? componentSupplements.filter(supplement => targetSupplementIds.has(supplement.id)) : componentSupplements;
    });

    return calculateIntakeForTarget(targetTagParam, targetUnit, mealSummaries, supplementsForPeriod, selectedTrackingValue);
  }, [selectedDateKeys, dailyNutritionTracking, takenDates, targetTagParam, targetUnit, targetSupplementIds, selectedTrackingValue]);

  const foodActual = foodAmount;
  const supplementActual = supplementAmount;
  const totalActual = foodActual + supplementActual;
  const contributingMeals = useMemo(() => {
    if (isWeeklyTarget && (targetUnit === 'items' || targetUnit === 'count' || targetUnit === 'plants')) {
      const contributions = weeklyNutritionTracking[selectedWeekBounds.weekStartKey] ?? [];

      return contributions
        .map((contribution): ContributingNutritionEntry | null => {
          const trackingValue = contribution.signals[targetTagParam];

          if (trackingValue === undefined) {
            return null;
          }

          const amount = typeof trackingValue === 'number' ? trackingValue : trackingValue.length;

          if (amount <= 0) {
            return null;
          }

          const nutritionEntry = dailyNutritionTracking[contribution.date]?.entries.find(entry => entry.id === contribution.nutritionEntryId);

          if (!nutritionEntry) {
            return null;
          }

          const trackedItems = Array.isArray(trackingValue) ? trackingValue.map(item => item.local || item.en) : undefined;

          return {
            id: contribution.nutritionEntryId,
            dateKey: contribution.date,
            name: nutritionEntry.name?.trim() || t('nutritionLogger.unnamedEntry'),
            amount,
            trackedItems,
          };
        })
        .filter((entry): entry is ContributingNutritionEntry => entry !== null)
        .sort((left, right) => right.amount - left.amount);
    }

    return selectedDateKeys
      .flatMap(dateKey => {
        const entries = dailyNutritionTracking[dateKey]?.entries ?? [];

        return getContributingNutritionEntriesForTarget(entries, dateKey, targetTagParam, targetUnit, t);
      })
      .sort((left, right) => right.amount - left.amount);
  }, [dailyNutritionTracking, isWeeklyTarget, selectedDateKeys, selectedWeekBounds.weekStartKey, t, targetTagParam, targetUnit, weeklyNutritionTracking]);

  const hasData = foodActual + supplementActual > 0;

  const split = useMemo(() => {
    const fromFood = foodActual;
    const fromSupplement = supplementActual;
    const total = fromFood + fromSupplement;

    if (total <= 0) {
      return { fromFood: 0, fromSupplement: 0 };
    }

    const normalizedFood = Math.round((fromFood / total) * 100);
    return {
      fromFood: normalizedFood,
      fromSupplement: 100 - normalizedFood,
    };
  }, [foodActual, supplementActual]);

  const goalProgress = useMemo(() => {
    if (targetAmount <= 0) {
      return {
        percent: 0,
        filledFraction: 0,
        foodShare: 0,
        supplementShare: 0,
      };
    }

    const total = foodActual + supplementActual;
    const rawPercent = (total / targetAmount) * 100;
    const clampedPercent = Math.max(0, Math.min(rawPercent, 100));
    const foodShare = total > 0 ? foodActual / total : 0;
    const supplementShare = total > 0 ? supplementActual / total : 0;

    return {
      percent: Math.round(rawPercent),
      filledFraction: clampedPercent / 100,
      foodShare,
      supplementShare,
    };
  }, [targetAmount, foodActual, supplementActual]);

  const medalType = useMemo(() => {
    if (!hasData) return null;
    return getNutritionTargetMedalType({
      actual: totalActual,
      targetAmount,
      foodActual,
      unit: targetUnit,
    });
  }, [hasData, totalActual, targetAmount, foodActual, targetUnit]);
  const medalEmoji = getNutritionTargetMedalEmoji(medalType);
  const medalInfoSnapPoints = useMemo(() => ['42%', '62%'], []);
  const medalLabelKey = medalType
    ? {
        gold: 'common:tip-target-details.medal.goldLabel',
        silver: 'common:tip-target-details.medal.silverLabel',
        bronze: 'common:tip-target-details.medal.bronzeLabel',
      }[medalType]
    : null;
  const medalAccessibilityLabel = medalLabelKey
    ? `${t(medalLabelKey)}. ${t('common:tip-target-details.medal.infoButton')}`
    : `${t('common:tip-target-details.medal.none')}. ${t('common:tip-target-details.medal.infoButton')}`;

  const amountUnit = targetUnit;
  const { periodLabel, previousPeriodLabel, nextPeriodLabel, noDataText, noContributingMealsText } = getPeriodPresentation({
    isWeeklyTarget,
    selectedDateKey,
    selectedWeekStartKey: selectedWeekBounds.weekStartKey,
    selectedWeekEndKey: selectedWeekBounds.weekEndKey,
    language: i18n.language,
    t,
  });

  const iconName = getTipTargetIconName(tipId) ?? 'target';

  const size = 168;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const filledLength = goalProgress.filledFraction * circumference;
  const foodLength = goalProgress.foodShare * filledLength;
  const supplementLength = goalProgress.supplementShare * filledLength;
  const topStartOffset = -circumference / 4;

  const trackColor = colors.overlayLight ?? colors.border;
  const foodColor = colors.accentColor ?? colors.primary;
  const supplementColor = colors.goldSoft ?? colors.primary;
  const todaySelectedFoodSource = React.useCallback(
    (foodSourceKey: string) => {
      router.push({
        pathname: '/(tabs)/calendar',
        params: {
          selectedDate: selectedDateKey,
          openTab: 'meal',
          foodSource: foodSourceKey,
          tipId,
        },
      });
    },
    [router, selectedDateKey, tipId]
  );

  const handleOpenFoodPortionSheet = React.useCallback(
    (foodSourceKey: string, foodName: string, foodDetails: string, foodProfile: FoodNutrientProfile | null, servingSizes: FoodServing[]) => {
      setSelectedFoodSourceKey(foodSourceKey);
      setSelectedFoodName(foodName);
      setSelectedFoodDetails(foodDetails);
      setSelectedFoodProfile(foodProfile);
      setSelectedFoodServings(servingSizes);
      foodPortionBottomSheetRef.current?.present();
    },
    []
  );

  const handleSelectServing = React.useCallback(
    (serving: FoodServing) => {
      setDailyNutritionTracking(prev => {
        const existingEntries = prev[selectedDateKey]?.entries ?? [];
        const newEntry: NutritionEntry = {
          id: Crypto.randomUUID(),
          type: 'food',
          recordedAt: toRecordedAt(selectedDateKey, new Date()),
          name: `${selectedFoodName} (${serving.grams} g)`,
          protein: scaleFrom100(selectedFoodProfile?.protein, serving.grams),
          calories: scaleFrom100(selectedFoodProfile?.calories, serving.grams),
          carbohydrates: scaleFrom100(selectedFoodProfile?.carbohydrates, serving.grams),
          fat: scaleFrom100(selectedFoodProfile?.fat, serving.grams),
          fiber: scaleFrom100(selectedFoodProfile?.fiber, serving.grams),
          fiberByType: scaleMapFrom100(selectedFoodProfile?.fiberByType, serving.grams),
          aminoAcidsByType: scaleMapFrom100(selectedFoodProfile?.aminoAcidsByType, serving.grams),
          mineralsByType: scaleMapFrom100(selectedFoodProfile?.mineralsByType, serving.grams),
          vitaminsByType: scaleMapFrom100(selectedFoodProfile?.vitaminsByType, serving.grams),
          polyphenolByType: scaleMapFrom100(selectedFoodProfile?.polyphenolByType, serving.grams),
        };
        return {
          ...prev,
          [selectedDateKey]: buildDailySummary([...existingEntries, newEntry], selectedDateKey),
        };
      });
      router.push({
        pathname: '/(tabs)/calendar',
        params: {
          selectedDate: selectedDateKey,
          openTab: 'meal',
          tipId,
        },
      });
    },
    [router, selectedDateKey, selectedFoodName, selectedFoodProfile, setDailyNutritionTracking, tipId]
  );

  const handleOpenMedalInfo = React.useCallback(() => {
    medalInfoBottomSheetRef.current?.present();
  }, []);

  return (
    <Container background="default" showBackButton onBackPress={() => router.back()}>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentWeak }]}>
            <IconSymbol name={iconName} size={24} color={colors.primary} />
          </View>
          <View style={styles.topTextBlock}>
            <ThemedText type="title3" style={styles.titleText}>
              {tipTitle}
            </ThemedText>
            {!!targetLabel && (
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {targetLabel}
              </ThemedText>
            )}
            <TouchableOpacity
              onPress={handleOpenMedalInfo}
              activeOpacity={0.8}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={medalAccessibilityLabel}
              style={[styles.medalButton, { backgroundColor: colors.secondaryBackground, borderColor: colors.borderLight ?? colors.border }]}
            >
              {medalType ? (
                <ThemedText type="default" style={{ color: medalType === 'gold' ? colors.primary : colors.textMuted }}>
                  {medalEmoji}
                </ThemedText>
              ) : (
                <ThemedText type="default" style={{ color: colors.textMuted }}>
                  {t('common:tip-target-details.medal.none')}
                </ThemedText>
              )}
              <IconSymbol name="chevron.right" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.chartRow}>
          <View style={styles.chartWrap}>
            <Svg width={size} height={size}>
              <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
              {filledLength > 0 && (
                <>
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={foodColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${foodLength} ${Math.max(circumference - foodLength, 0.001)}`}
                    strokeDashoffset={topStartOffset}
                    fill="none"
                  />
                  {supplementLength > 0 && (
                    <Circle
                      cx={center}
                      cy={center}
                      r={radius}
                      stroke={supplementColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={`${supplementLength} ${Math.max(circumference - supplementLength, 0.001)}`}
                      strokeDashoffset={topStartOffset - foodLength}
                      fill="none"
                    />
                  )}
                </>
              )}
            </Svg>
            <View style={styles.chartCenterText}>
              <ThemedText type="title2" style={styles.centerPercent}>
                {`${goalProgress.percent}%`}
              </ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {`${formatWithUnit(totalActual, amountUnit, targetTagParam)}/${formatWithUnit(targetAmount, amountUnit, targetTagParam)}`}
              </ThemedText>
            </View>
          </View>

          <View style={styles.breakdownBlock}>
            {hasData ? (
              <>
                <ThemedText type="defaultSemiBold" style={{ color: foodColor }}>
                  {t('common:tip-target-details.breakdown.viaFood', { percent: split.fromFood })}
                </ThemedText>
                {isSupplementEligibleUnit(targetUnit) && (
                  <ThemedText type="defaultSemiBold" style={{ color: supplementColor }}>
                    {t('common:tip-target-details.breakdown.viaSupplement', { percent: split.fromSupplement })}
                  </ThemedText>
                )}
              </>
            ) : (
              <ThemedText type="defaultSemiBold" style={{ color: colors.textMuted }}>
                {t('common:tip-target-details.noData')}
              </ThemedText>
            )}
          </View>
        </View>

        <PeriodNavigationSection
          colors={colors}
          t={t}
          periodLabel={periodLabel}
          canGoForward={canGoForward}
          previousAccessibilityLabel={previousPeriodLabel}
          nextAccessibilityLabel={nextPeriodLabel}
          onPrevious={() => setSelectedDateKey(prev => addDays(prev, isWeeklyTarget ? -7 : -1))}
          onNext={() => {
            if (canGoForward) {
              setSelectedDateKey(prev => addDays(prev, isWeeklyTarget ? 7 : 1));
            }
          }}
        />

        <IntakeDetailsSection
          colors={colors}
          t={t}
          hasData={hasData}
          totalActual={totalActual}
          foodActual={foodActual}
          supplementActual={supplementActual}
          targetAmount={targetAmount}
          amountUnit={amountUnit}
          targetTagParam={targetTagParam}
          noDataText={noDataText}
        />

        <ContributingMealsSection
          colors={colors}
          t={t}
          contributingMeals={contributingMeals}
          amountUnit={amountUnit}
          targetTagParam={targetTagParam}
          targetLabel={targetLabel}
          emptyText={noContributingMealsText}
          language={i18n.language}
        />

        <View style={[styles.supplementSection, { borderColor: colors.borderLight ?? colors.border }]}>
          <ThemedText type="title3" style={styles.supplementHeading}>
            {t('common:tip-target-details.supplements.title')}
          </ThemedText>
          {listedSupplements.length > 0 ? (
            <View style={styles.supplementList}>
              {listedSupplements.map(supplement => (
                <View key={supplement.id} style={styles.supplementRow}>
                  <View style={styles.supplementInfoRow}>
                    <IconSymbol name="pill" size={16} color={colors.textLight} />
                    <ThemedText type="default" style={[styles.supplementText]}>
                      {`${supplement.name} (${supplement.quantity} ${supplement.unit})`}
                    </ThemedText>
                  </View>
                  <DiscreetButton
                    title={t('general.add')}
                    onPress={() => {
                      router.push({
                        pathname: '/(tabs)/calendar',
                        params: {
                          selectedDate: selectedDateKey,
                          openTab: 'supplements',
                          supplementId: supplement.id,
                        },
                      });
                    }}
                  />
                </View>
              ))}
            </View>
          ) : (
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('common:tip-target-details.supplements.noneListed')}
            </ThemedText>
          )}
        </View>

        <View style={[styles.foodSourceSection, { borderColor: colors.borderLight ?? colors.border }]}>
          <ThemedText type="title3" style={styles.supplementHeading}>
            {t('common:tip-target-details.foodSources.title')}
          </ThemedText>
          {nutritionFoodItems.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodSourceScrollContent}>
              {nutritionFoodItems.map(({ key, foodKey, name, details }) => {
                const foodSourceKey = foodKey;
                const foodProfile = isFoodProfileKey(foodSourceKey) ? FOOD_NUTRIENT_PROFILES[foodSourceKey] : null;
                const foodImage: ImageSourcePropType | undefined = isFoodProfileKey(foodSourceKey)
                  ? (FOOD_IMAGES[foodSourceKey] as ImageSourcePropType | undefined)
                  : undefined;
                const servingSizes: FoodServing[] = foodProfile?.defaultServings ?? [];
                return (
                  <Pressable
                    key={key}
                    onPress={() => {
                      if (servingSizes.length > 0 && foodProfile) {
                        handleOpenFoodPortionSheet(foodSourceKey, name, details || '', foodProfile, servingSizes);
                      } else {
                        todaySelectedFoodSource(foodSourceKey);
                      }
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t('common:tip-target-details.foodSources.addSource', { name })}
                    style={({ pressed }) => [
                      styles.foodSourceCard,
                      {
                        borderColor: colors.borderLight ?? colors.border,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    {!!foodImage && <Image source={foodImage} style={styles.foodSourceImage} resizeMode="cover" />}
                    <View style={styles.foodSourceTextBlock}>
                      <ThemedText type="defaultSemiBold" numberOfLines={2}>
                        {name}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.foodSourceAddButton,
                        {
                          backgroundColor: colors.accentVeryWeak,
                        },
                      ]}
                    >
                      <ThemedText type="defaultSemiBold" style={{ color: colors.primary }}>
                        +
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : (
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('common:tip-target-details.foodSources.noneListed')}
            </ThemedText>
          )}
        </View>

        <FoodPortionBottomSheet
          foodPortionBottomSheetRef={foodPortionBottomSheetRef}
          snapPoints={['45%', '75%']}

          colors={colors}
          foodName={selectedFoodName}
          foodDetails={selectedFoodDetails}
          foodImage={selectedFoodImage}
          servingSizes={selectedFoodServings}
          nutrientPer100={getProfileValueForTag(selectedFoodProfile, targetTagParam)}
          nutrientUnit={targetUnit}
          nutrientLabel={targetLabel || undefined}
          nutrientTag={targetTagParam || undefined}
          onSelectServing={handleSelectServing}
        />

        <BottomSheetModal
          ref={medalInfoBottomSheetRef}
          snapPoints={medalInfoSnapPoints}
          enablePanDownToClose
          animateOnMount
          backgroundStyle={sheetDesign.backgroundStyle}
          handleComponent={sheetDesign.handleComponent}
        >
          <BottomSheetScrollView
            style={styles.medalInfoScroll}
            contentContainerStyle={styles.medalInfoContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title3">{t('common:tip-target-details.medal.infoTitle')}</ThemedText>
            <ThemedText type="caption" style={{ color: colors.textMuted }}>
              {t('common:tip-target-details.medal.infoIntro')}
            </ThemedText>

            <View style={styles.medalInfoList}>
              <View style={styles.medalInfoRow}>
                <ThemedText type="defaultSemiBold">{t('common:tip-target-details.medal.goldRule.title')}</ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {t('common:tip-target-details.medal.goldRule.body')}
                </ThemedText>
              </View>
              <View style={styles.medalInfoRow}>
                <ThemedText type="defaultSemiBold">{t('common:tip-target-details.medal.silverRule.title')}</ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {t('common:tip-target-details.medal.silverRule.body')}
                </ThemedText>
              </View>
              <View style={styles.medalInfoRow}>
                <ThemedText type="defaultSemiBold">{t('common:tip-target-details.medal.bronzeRule.title')}</ThemedText>
                <ThemedText type="caption" style={{ color: colors.textMuted }}>
                  {t('common:tip-target-details.medal.bronzeRule.body')}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.medalInfoNote, { backgroundColor: colors.accentVeryWeak ?? colors.cardBackground }]}>
              <ThemedText type="defaultSemiBold">{t('common:tip-target-details.medal.discreteRule.title')}</ThemedText>
              <ThemedText type="caption" style={{ color: colors.textMuted }}>
                {t('common:tip-target-details.medal.discreteRule.body')}
              </ThemedText>
            </View>
          </BottomSheetScrollView>
        </BottomSheetModal>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTextBlock: {
    flex: 1,
    gap: 2,
  },
  medalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 36,
    minWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
  },
  titleText: {
    marginBottom: 0,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  chartWrap: {
    width: 176,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartCenterText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPercent: {
    marginBottom: 0,
  },
  breakdownBlock: {
    flex: 1,
    gap: 8,
  },
  supplementSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  mealsSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  foodSourceSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  dateSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  dateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailsSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  detailsHeading: {
    marginBottom: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  supplementHeading: {
    marginBottom: 0,
  },
  supplementList: {
    gap: 6,
  },
  mealsList: {
    gap: 8,
  },
  mealContributionCard: {
    borderRadius: 10,
  },
  mealContributionAmount: {
    marginLeft: 'auto',
  },
  mealContributionDetails: {
    gap: 8,
  },
  mealContributionItems: {
    gap: 4,
  },
  supplementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  supplementText: {
    flex: 1,
  },
  supplementInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodSourceScrollContent: {
    gap: 10,
    paddingVertical: 2,
    paddingRight: 4,
  },
  foodSourceCard: {
    width: 110,
    borderWidth: 1,
    borderRadius: 14,
    paddingBottom: 8,
    gap: 2,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  foodSourceTextBlock: {
    gap: 1,
  },
  foodSourceAddButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodSourceImage: {
    width: 80,
    height: 80,
  },
  medalInfoScroll: {
    flex: 1,
  },
  medalInfoContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 14,
  },
  medalInfoList: {
    gap: 12,
  },
  medalInfoRow: {
    gap: 4,
  },
  medalInfoNote: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
});
