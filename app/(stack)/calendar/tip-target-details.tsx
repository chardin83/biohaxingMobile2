import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import Svg, { Circle } from 'react-native-svg';

import { useStorage } from '@/app/context/StorageContext';
import FoodPortionBottomSheet, { FoodServing } from '@/components/FoodPortionBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import Container from '@/components/ui/Container';
import DiscreetButton from '@/components/ui/DiscreetButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { isAminoAcidTargetTag } from '@/constants/aminoAcids';
import { isFiberTargetTag } from '@/constants/fiber';
import { isMineralTargetTag } from '@/constants/minerals';
import { isPolyphenolTargetTag } from '@/constants/polyphenols';
import { isVitaminTargetTag } from '@/constants/vitamins';
import {
  FOOD_IMAGES,
  FOOD_NUTRIENT_PROFILES,
  FoodNutrientProfile,
  type FoodServing as FoodCatalogServing,
} from '@/locales/foodCatalog';
import { useSupplementMap } from '@/locales/supplements';
import { getTipTargetIconName, type NutrientTag, tips } from '@/locales/tips';
import { formatWithUnit } from '@/utils/formatters';
import { getNutritionTargetMedalEmoji, getNutritionTargetMedalType } from '@/utils/medals';

const BottomSheetOverlayContainer = ({ children }: { children?: React.ReactNode }) => (
  <FullWindowOverlay>{children}</FullWindowOverlay>
);

const parseNumber = (value: string | string[] | undefined): number => {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

const parseCommaSeparated = (value: string | string[] | undefined): string[] => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return [];
  return raw
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);
};

const addDays = (dateKey: string, days: number): string => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date().toISOString().split('T')[0];
  }

  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + days);
  const nextYear = nextDate.getFullYear();
  const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
  const nextDay = String(nextDate.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
};

const formatDateLabel = (dateKey: string): string => {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return dateKey;
  }

  return new Date(year, month - 1, day).toLocaleDateString('sv-SE', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
    { protein: 0, calories: 0, carbohydrates: 0, fat: 0, fiber: 0 }
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

const calculateDailyIntakeForTarget = (
  targetTag: string,
  targetUnit: string,
  mealsSummary: any,
  supplementsForDay: any[]
): { foodAmount: number; supplementAmount: number } => {
  if (targetUnit !== 'mg' && targetUnit !== 'g') {
    return { foodAmount: 0, supplementAmount: 0 };
  }

  const meals = Array.isArray(mealsSummary?.meals) ? mealsSummary.meals : [];
  const foodAmount = meals.reduce(
    (sum: number, meal: any) => sum + getMealContributionForTarget(meal, targetTag, targetUnit),
    0
  );
  const supplementAmount = supplementsForDay.reduce(
    (sum: number, supp: any) =>
      sum + getSupplementContributionForTargetUnit(Number(supp.quantity) || 0, (supp.unit || '').toLowerCase(), targetUnit),
    0
  );

  return { foodAmount: Math.max(0, foodAmount), supplementAmount: Math.max(0, supplementAmount) };
};

const getSupplementContributionForTargetUnit = (
  quantity: number,
  unit: string,
  targetUnit: string
): number => {
  if (!quantity) return 0;

  if (targetUnit === 'mg') {
    if (unit === 'mg') return quantity;
    if (unit === 'g') return quantity * 1000;
    if (unit === 'mcg' || unit === 'μg' || unit === 'ug') return quantity / 1000;
    return 0;
  }

  if (targetUnit === 'g') {
    if (unit === 'g') return quantity;
    if (unit === 'mg') return quantity / 1000;
    if (unit === 'mcg' || unit === 'μg' || unit === 'ug') return quantity / 1_000_000;
  }

  return 0;
};

const getMealContributionForTarget = (
  meal: any,
  targetTag: string,
  targetUnit: string
): number => {
  if (targetUnit !== 'mg' && targetUnit !== 'g') return 0;

  const isMineralKey =
    targetTag.includes('mineral') ||
    /magnesium|calcium|iron|zinc|copper|manganese|molybdenum|chromium|phosphorus|iodine|selenium/.test(
      targetTag.toLowerCase()
    );
  const isVitaminKey =
    targetTag.includes('vitamin') ||
    /vitamina|vitaminb|vitaminc|vitamind|vitamine|vitamink/.test(targetTag.toLowerCase());
  const isAminoAcidKey = isAminoAcidTargetTag(targetTag);

  if (isMineralKey && meal?.mineralsByType?.[targetTag]) {
    return Number(meal.mineralsByType[targetTag]) || 0;
  }
  if (isVitaminKey && meal?.vitaminsByType?.[targetTag]) {
    return Number(meal.vitaminsByType[targetTag]) || 0;
  }
  if (isAminoAcidKey && meal?.aminoAcidsByType?.[targetTag]) {
    return Number(meal.aminoAcidsByType[targetTag]) || 0;
  }
  if (meal?.fiberByType?.[targetTag]) {
    return Number(meal.fiberByType[targetTag]) || 0;
  }

  return 0;
};

const getContributingMealsForTarget = (
  meals: any[],
  selectedDateKey: string,
  targetTag: string,
  targetUnit: string,
  t: (key: string) => string
) =>
  meals
    .map((meal: any, index: number) => ({
      id: typeof meal?.id === 'string' ? meal.id : `${selectedDateKey}-meal-${index}`,
      name:
        typeof meal?.mealName === 'string' && meal.mealName.trim().length > 0
          ? meal.mealName
          : t('nutritionLogger.unnamedMeal'),
      amount: getMealContributionForTarget(meal, targetTag, targetUnit),
    }))
    .filter(meal => meal.amount > 0)
    .sort((left, right) => right.amount - left.amount);

const scaleFrom100 = (value: number | undefined, grams: number): number => {
  if (typeof value !== 'number') return 0;
  return Number(((value * grams) / 100).toFixed(3));
};

const getProfileValueForTag = (
  profile: FoodNutrientProfile | null,
  targetTag: string
): number | undefined => {
  if (!profile || !targetTag) return undefined;
  if (isMineralTargetTag(targetTag)) return profile.mineralsByType?.[targetTag];
  if (isVitaminTargetTag(targetTag)) return profile.vitaminsByType?.[targetTag];
  if (isAminoAcidTargetTag(targetTag)) return profile.aminoAcidsByType?.[targetTag];
  if (isFiberTargetTag(targetTag)) return profile.fiberByType?.[targetTag];
  if (isPolyphenolTargetTag(targetTag)) return profile.polyphenolByType?.[targetTag];
  return undefined;
};

const scaleMapFrom100 = <K extends string>(
  map: Partial<Record<K, number>> | undefined,
  grams: number
): Record<string, number> => {
  if (!map) return {};
  return Object.fromEntries(
    Object.entries(map as Record<string, number | undefined>).map(([key, value]) => [key, scaleFrom100(value, grams)])
  );
};

const isFoodProfileKey = (key: string): key is keyof typeof FOOD_NUTRIENT_PROFILES =>
  key in FOOD_NUTRIENT_PROFILES;

const ContributingMealsSection = ({
  colors,
  t,
  contributingMeals,
  amountUnit,
  targetTagParam,
}: {
  colors: any;
  t: (key: string) => string;
  contributingMeals: Array<{ id: string; name: string; amount: number }>;
  amountUnit: string;
  targetTagParam: string;
}) => {
  if (contributingMeals.length === 0) {
    return (
      <View style={[styles.mealsSection, { borderColor: colors.borderLight ?? colors.border }]}> 
        <ThemedText type="title3" style={styles.supplementHeading}>
          {t('common:tip-target-details.meals.title')}
        </ThemedText>
        <ThemedText type="caption" style={{ color: colors.textMuted }}>
          {t('common:tip-target-details.meals.noneContributed')}
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
          <View key={meal.id} style={styles.detailRow}>
            <ThemedText type="default" style={styles.supplementText}>
              {meal.name}
            </ThemedText>
            <ThemedText type="defaultSemiBold">
              {formatWithUnit(meal.amount, amountUnit, targetTagParam)}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
};

export default function TipTargetDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const supplementMap = useSupplementMap();
  const foodPortionBottomSheetRef = useRef<BottomSheetModal>(null);
  const medalInfoBottomSheetRef = useRef<BottomSheetModal | null>(null);
  const [selectedFoodName, setSelectedFoodName] = useState<string>('');
  const [selectedFoodDetails, setSelectedFoodDetails] = useState<string>('');
  const [selectedFoodSourceKey, setSelectedFoodSourceKey] = useState<string>('');
  const [selectedFoodProfile, setSelectedFoodProfile] = useState<FoodNutrientProfile | null>(null);
  const [selectedFoodServings, setSelectedFoodServings] = useState<FoodServing[]>([]);
  const { dailyNutritionSummaries, takenDates, setDailyNutritionSummaries } = useStorage();
  const params = useLocalSearchParams<{
    tipId?: string;
    tipTitle?: string;
    targetLabel?: string;
    targetTag?: string;
    foodActual?: string;
    supplementActual?: string;
    targetAmount?: string;
    targetUnit?: string;
    dateKey?: string;
    targetSupplementIds?: string;
  }>();

  const tipId = params.tipId ?? '';
  const tipMeta = tips.find(candidate => candidate.id === tipId);
  const targetTagParam = (Array.isArray(params.targetTag) ? params.targetTag[0] : params.targetTag) ?? '';
  const selectedFoodImage: ImageSourcePropType | undefined =
    isFoodProfileKey(selectedFoodSourceKey)
      ? (FOOD_IMAGES[selectedFoodSourceKey] as ImageSourcePropType | undefined)
      : undefined;
  const targetSupplementIds = useMemo(
    () => new Set(parseCommaSeparated(params.targetSupplementIds)),
    [params.targetSupplementIds]
  );
  const listedSupplements = (tipMeta?.supplements ?? [])
    .filter(reference =>
      targetSupplementIds.size > 0 ? targetSupplementIds.has(reference.id) : true
    )
    .map(reference => supplementMap.get(reference.id))
    .filter((supplement): supplement is NonNullable<typeof supplement> => Boolean(supplement));
  const nutritionFoodItems = useMemo(() => {
    if (!tipMeta?.nutritionFoods?.length || !tipMeta.id) {
      return [] as { key: string; foodKey: string; name: string; details: string }[];
    }

    const matchingFoods = targetTagParam
      ? tipMeta.nutritionFoods.filter(food =>
          food.nutrientTags?.includes(targetTagParam as NutrientTag)
        )
      : [];
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
  const today = new Date().toISOString().split('T')[0];
  const initialDateKey =
    params.dateKey && params.dateKey.length > 0 ? params.dateKey : today;
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const isAtOrAfterToday = selectedDateKey >= today;
  const canGoForward = !isAtOrAfterToday;
  const targetAmount = parseNumber(params.targetAmount);
  const amountUnitParam =
    (Array.isArray(params.targetUnit) ? params.targetUnit[0] : params.targetUnit)?.toLowerCase() ?? '';

  const { foodAmount, supplementAmount } = useMemo(() => {
    const mealsSummary = dailyNutritionSummaries[selectedDateKey];
    const allSupplementsForDay = takenDates[selectedDateKey] ?? [];
    const supplementsForDay =
      targetSupplementIds.size > 0
        ? allSupplementsForDay.filter(s => targetSupplementIds.has(s.id))
        : allSupplementsForDay;
    return calculateDailyIntakeForTarget(targetTagParam, amountUnitParam, mealsSummary, supplementsForDay);
  }, [selectedDateKey, dailyNutritionSummaries, takenDates, targetTagParam, amountUnitParam, targetSupplementIds]);

  const foodActual = foodAmount;
  const supplementActual = supplementAmount;
  const totalActual = foodActual + supplementActual;
  const contributingMeals = useMemo(() => {
    const meals = Array.isArray(dailyNutritionSummaries[selectedDateKey]?.meals)
      ? dailyNutritionSummaries[selectedDateKey].meals
      : [];

    return getContributingMealsForTarget(meals, selectedDateKey, targetTagParam, amountUnitParam, t);
  }, [dailyNutritionSummaries, selectedDateKey, t, targetTagParam, amountUnitParam]);

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
      unit: amountUnitParam as 'g' | 'mg' | 'plants' | 'items' | 'count',
    });
  }, [hasData, totalActual, targetAmount, foodActual, amountUnitParam]);
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

  const amountUnit = amountUnitParam || '';

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
    (
      foodSourceKey: string,
      foodName: string,
      foodDetails: string,
      foodProfile: FoodNutrientProfile | null,
      servingSizes: FoodServing[]
    ) => {
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
      const mealName = `${selectedFoodName} (${serving.label})`;

      setDailyNutritionSummaries(prev => {
        const existingMeals = prev[selectedDateKey]?.meals ?? [];
        const newMeal = {
          id: `${selectedDateKey}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          date: selectedDateKey,
          mealName,
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
          foodSource: selectedFoodSourceKey,
          servingGrams: serving.grams,
          servingLabel: serving.label,
        };

        return {
          ...prev,
          [selectedDateKey]: buildDailySummary([...existingMeals, newMeal], selectedDateKey),
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
    [
      router,
      selectedDateKey,
      selectedFoodName,
      selectedFoodProfile,
      selectedFoodSourceKey,
      setDailyNutritionSummaries,
      tipId,
    ]
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
              style={[
                styles.medalButton,
                { backgroundColor: colors.secondaryBackground, borderColor: colors.borderLight ?? colors.border },
              ]}
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
              <Circle
                cx={center}
                cy={center}
                r={radius}
                stroke={trackColor}
                strokeWidth={strokeWidth}
                fill="none"
              />
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
                <ThemedText type="defaultSemiBold" style={{ color: supplementColor }}>
                  {t('common:tip-target-details.breakdown.viaSupplement', { percent: split.fromSupplement })}
                </ThemedText>
              </>
            ) : (
              <ThemedText type="defaultSemiBold" style={{ color: colors.textMuted }}>
                {t('common:tip-target-details.noData')}
              </ThemedText>
            )}
          </View>
        </View>

        <View style={[styles.dateSection, { borderColor: colors.borderLight ?? colors.border }]}> 
          <ThemedText type="defaultSemiBold">{t('common:tip-target-details.date.title')}</ThemedText>
          <View style={styles.dateNavRow}>
            <TouchableOpacity
              onPress={() => setSelectedDateKey(prev => addDays(prev, -1))}
              accessibilityRole="button"
              accessibilityLabel={t('common:tip-target-details.date.previousDay')}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.primary} />
            </TouchableOpacity>
            <ThemedText type="default">{formatDateLabel(selectedDateKey)}</ThemedText>
            <TouchableOpacity
              onPress={() => {
                if (canGoForward) {
                  setSelectedDateKey(prev => addDays(prev, 1));
                }
              }}
              disabled={!canGoForward}
              accessibilityRole="button"
              accessibilityLabel={t('common:tip-target-details.date.nextDay')}
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={canGoForward ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>

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
              {t('common:tip-target-details.details.noDataForDay')}
            </ThemedText>
          )}
          <View style={styles.detailRow}>
            <ThemedText type="default">{t('common:tip-target-details.details.goal')}</ThemedText>
            <ThemedText type="defaultSemiBold">{formatWithUnit(targetAmount, amountUnit, targetTagParam)}</ThemedText>
          </View>
        </View>

        <ContributingMealsSection
          colors={colors}
          t={t}
          contributingMeals={contributingMeals}
          amountUnit={amountUnit}
          targetTagParam={targetTagParam}
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
                const foodProfile = isFoodProfileKey(foodSourceKey)
                  ? FOOD_NUTRIENT_PROFILES[foodSourceKey]
                  : null;
                const foodImage: ImageSourcePropType | undefined = isFoodProfileKey(foodSourceKey)
                  ? (FOOD_IMAGES[foodSourceKey] as ImageSourcePropType | undefined)
                  : undefined;
                const servingOptions: FoodCatalogServing[] = foodProfile?.defaultServings ?? [];
                const nutrientPer100 = getProfileValueForTag(foodProfile, targetTagParam);
                const servingSizes = servingOptions.map(serving => ({
                  grams: serving.grams,
                  label: serving.labelKey
                    ? t(`food:servingSizes.${serving.labelKey}`, {
                        defaultValue: String(serving.grams),
                      })
                    : `${serving.grams} ${t('food:units.gramsShort', { defaultValue: 'g' })}`,
                  nutrientAmount:
                    typeof nutrientPer100 === 'number'
                      ? scaleFrom100(nutrientPer100, serving.grams)
                      : undefined,
                  nutrientUnit: amountUnitParam || undefined,
                  nutrientLabel: targetLabel || undefined,
                  nutrientTag: targetTagParam || undefined,
                }));
                return (
                  <View key={key} style={[styles.foodSourceCard, { borderColor: colors.borderLight ?? colors.border }]}> 
                    {!!foodImage && (
                      <Image
                        source={foodImage}
                        style={styles.foodSourceImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.foodSourceTextBlock}>
                      <ThemedText type="defaultSemiBold" numberOfLines={2}>
                        {name}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => {
                        if (servingSizes.length > 0 && foodProfile) {
                          handleOpenFoodPortionSheet(
                            foodSourceKey,
                            name,
                            details || '',
                            foodProfile,
                            servingSizes
                          );
                        } else {
                          todaySelectedFoodSource(foodSourceKey);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t('common:tip-target-details.foodSources.addSource', { name })}
                      style={({ pressed }) => [
                        styles.foodSourceAddButton,
                        {
                          backgroundColor: colors.accentVeryWeak,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <ThemedText type="defaultSemiBold" style={{ color: colors.primary }}>
                        +
                      </ThemedText>
                    </Pressable>
                  </View>
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
          BottomSheetOverlayContainer={BottomSheetOverlayContainer}
          colors={colors}
          foodName={selectedFoodName}
          foodDetails={selectedFoodDetails}
          foodImage={selectedFoodImage}
          servingSizes={selectedFoodServings}
          onSelectServing={handleSelectServing}
        />

        <BottomSheetModal
          ref={medalInfoBottomSheetRef}
          snapPoints={medalInfoSnapPoints}
          enablePanDownToClose
          animateOnMount
          containerComponent={BottomSheetOverlayContainer}
          backgroundStyle={{ backgroundColor: colors.background }}
          handleIndicatorStyle={{ backgroundColor: colors.textMuted }}
        >
          <BottomSheetScrollView
            style={styles.medalInfoScroll}
            contentContainerStyle={styles.medalInfoContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title3">
              {t('common:tip-target-details.medal.infoTitle')}
            </ThemedText>
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

            <View
              style={[
                styles.medalInfoNote,
                { backgroundColor: colors.accentVeryWeak ?? colors.cardBackground },
              ]}
            >
              <ThemedText type="defaultSemiBold">
                {t('common:tip-target-details.medal.discreteRule.title')}
              </ThemedText>
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
