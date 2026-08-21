import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ImageSourcePropType } from 'react-native';
import { Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useStorage } from '@/app/context/StorageContext';
import { buildNutritionPlanTipProgress } from '@/components/nutritionTargets.logic';
import PlanCategoryIcon, { type PlanCategory } from '@/components/plan/PlanCategoryIcon';
import { MetricsBottomSheet } from '@/components/sections/metrics/MetricsBottomSheet';
import { ThemedText } from '@/components/ThemedText';
import TipTarget, { type TipTargetProgress } from '@/components/TipTarget';
import AppBox from '@/components/ui/AppBox';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PencilEditButton from '@/components/ui/PencilEditButton';
import { PressableCard } from '@/components/ui/PressableCard';
import { ALL_AMINO_ACID_KEYS } from '@/constants/aminoAcids';
import { MINERAL_TYPE_KEYS } from '@/constants/minerals';
import { VITAMIN_TYPE_KEYS } from '@/constants/vitamins';
import { FOOD_IMAGES } from '@/locales/foodCatalog';
import { metrics, tipMetricLinks } from '@/locales/metrics';
import { tips } from '@/locales/tips';
import { extractWeeklyTrackingSignals, mergeWeeklyTrackingSignal, parseNumberValue,type WeeklyTrackingSignals } from '@/utils/analyzeNutrition';
import { formatDate as formatDateValue, toDateKey } from '@/utils/dateUtils';
import { calculateTrainingWeeklyProgress } from '@/utils/trainingProgress';

type PlanDetailsParams = {
  tipId?: string;
  title?: string;
  startedAt?: string;
  createdBy?: string;
  comment?: string;
  planCategory?: string;
  cardData?: string;
};

type CardBadge = {
  label: string;
  icon?: string;
};

type CardFoodItem = {
  name: string;
  details?: string;
  imageKey?: string;
  foodKey?: string;
  detailsKey?: string;
};

type CardData = {
  badges?: CardBadge[];
  recommendedDoseLabel?: string;
  foodItems?: CardFoodItem[];
  supplementNames?: string[];
};

type PlanTargetItem = {
  key: string;
  tag: string;
  unit: 'g' | 'mg' | 'plants' | 'items' | 'count';
  period: 'daily' | 'weekly';
  amount: number;
  label: string;
  value: string;
};

const sumTypedTotals = (
  meals: Array<any>,
  key: 'fiberByType' | 'polyphenolByType' | 'mineralsByType' | 'vitaminsByType' | 'aminoAcidsByType'
) =>
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

const getWeekStartKeyForDate = (date: Date): string => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  const day = normalized.getDay();
  const diffToMonday = (day + 6) % 7;
  normalized.setDate(normalized.getDate() - diffToMonday);
  return toDateKey(normalized);
};

const PLAN_CATEGORY_LABEL_KEYS: Record<PlanCategory, string> = {
  training: 'plan.trainingHeader',
  nutrition: 'plan.nutritionHeader',
  other: 'plan.otherHeader',
  supplement: 'plan.supplementSectionTitle',
};

export default function PlanDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation(['common', 'areas', 'tips']);
  const params = useLocalSearchParams<PlanDetailsParams>();
  const { setPlans, plans, trainingPlanSettings, trainingEntries, dailyNutritionSummaries, weeklyTracking, takenDates } = useStorage();
  const metricsBottomSheetRef = React.useRef<BottomSheet>(null);

  const [isEditingComment, setIsEditingComment] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState(params.comment ?? '');

  const tip = React.useMemo(() => {
    if (!params.tipId) return undefined;
    return tips.find(candidate => candidate.id === params.tipId);
  }, [params.tipId]);

  const title = params.title || (tip ? t(`tips:${tip.id}.title`) : t('plan.untitled'));
  const descriptionText = tip ? t(`tips:${tip.descriptionKey}`) : t('plan.noTipDetails');

  const targets = React.useMemo(() => {
    if (!tip) return [] as PlanTargetItem[];

    const fiberTargets = tip.fiberTargets ?? [];
    const polyphenolTargets = tip.polyphenolTargets ?? [];
    const mineralTargets = tip.mineralTargets ?? [];
    const vitaminTargets = tip.vitaminTargets ?? [];
    const aminoAcidTargets = tip.aminoAcidTargets ?? [];
    const trackingTargets = tip.trackingTargets ?? [];
    const allTargets = [...fiberTargets, ...polyphenolTargets, ...mineralTargets, ...vitaminTargets, ...aminoAcidTargets, ...trackingTargets];

    const mineralTags = new Set(MINERAL_TYPE_KEYS);
    const aminoAcidTags = new Set(ALL_AMINO_ACID_KEYS);
    const vitaminTags = new Set(VITAMIN_TYPE_KEYS);

    const formatValue = (value: number, unit: 'g' | 'mg' | 'plants' | 'items' | 'count') => {
      if (unit === 'plants' || unit === 'items' || unit === 'count') {
        return `${Math.round(value)} ${unit}`;
      }

      let decimals = 1;
      if (unit === 'mg') {
        if (value < 0.01) {
          decimals = 4;
        } else if (value < 1) {
          decimals = 3;
        } else if (value < 10) {
          decimals = 2;
        } else {
          decimals = 0;
        }
      }
      return `${value.toFixed(decimals)} ${unit}`;
    };

    return allTargets.map((target: any) => {
      const trackingKey = 'trackingKey' in target ? target.trackingKey : target.tag;
      let labelGroup: 'weeklyTrackingLabels' | 'fiberLabels' | 'aminoAcidLabels' | 'mineralLabels' | 'vitaminLabels' | 'polyphenolLabels' = 'polyphenolLabels';
      if (target.unit === 'plants' || target.unit === 'items' || target.unit === 'count') {
        labelGroup = 'weeklyTrackingLabels';
      } else if (target.unit === 'g') {
        labelGroup = 'fiberLabels';
      } else if (aminoAcidTags.has(trackingKey)) {
        labelGroup = 'aminoAcidLabels';
      } else if (mineralTags.has(trackingKey)) {
        labelGroup = 'mineralLabels';
      } else if (vitaminTags.has(trackingKey)) {
        labelGroup = 'vitaminLabels';
      }

      return {
        key: trackingKey,
        tag: trackingKey,
        unit: target.unit,
        period: target.period ?? 'daily',
        amount: target.amount,
        label: t(`nutritionLogger.${labelGroup}.${trackingKey}`, { defaultValue: trackingKey }),
        value: formatValue(target.amount, target.unit),
      };
    });
  }, [tip, t]);

  const cardData = React.useMemo<CardData | undefined>(() => {
    if (!params.cardData) return undefined;

    try {
      return JSON.parse(params.cardData as string) as CardData;
    } catch {
      return undefined;
    }
  }, [params.cardData]);

  const resolvedPlanCategory = React.useMemo<PlanCategory>(() => {
    const validCategories = ['training', 'nutrition', 'other', 'supplement'] as const;
    return validCategories.includes(params.planCategory as (typeof validCategories)[number])
      ? (params.planCategory as PlanCategory)
      : 'other';
  }, [params.planCategory]);

  const categoryLabel = React.useMemo(
    () => t(PLAN_CATEGORY_LABEL_KEYS[resolvedPlanCategory] ?? 'plan.planDetails'),
    [resolvedPlanCategory, t]
  );

  const targetProgressInfoText = React.useMemo(() => {
    const hasDailyTargets = targets.some(target => target.period === 'daily');
    const hasWeeklyTargets = targets.some(target => target.period === 'weekly');

    if (hasDailyTargets && hasWeeklyTargets) {
      return t('plan.targetsProgressInfoDailyWeekly');
    }

    if (hasWeeklyTargets) {
      return t('plan.targetsProgressInfoWeekly');
    }

    return t('plan.targetsProgressInfoDaily');
  }, [t, targets]);

  const trainingWeeklyProgress = React.useMemo(() => {
    if (resolvedPlanCategory !== 'training' || !params.tipId) return null;

    const target = trainingPlanSettings[params.tipId];
    if (!target) return null;

    const hasAnyTarget =
      typeof target.sessionsPerWeek === 'number' ||
      typeof target.sessionDurationMinutes === 'number' ||
      target.activityType !== undefined ||
      target.minimumIntensity !== undefined;

    if (!hasAnyTarget) return null;

    const selected = new Date();
    const day = selected.getDay();
    const mondayDiff = day === 0 ? -6 : 1 - day;

    const weekStart = new Date(selected);
    weekStart.setDate(selected.getDate() + mondayDiff);
    const weekStartKey = toDateKey(weekStart);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekEndKey = toDateKey(weekEnd);

    const weekEntries = Object.entries(trainingEntries)
      .filter(([dateKey]) => dateKey >= weekStartKey && dateKey <= weekEndKey)
      .flatMap(([, entries]) => entries);

    const progressInfo = calculateTrainingWeeklyProgress({
      entries: weekEntries,
      target,
    });

    return {
      weekStartKey,
      weekEndKey,
      actual: progressInfo.actual,
      target: progressInfo.target,
      progress: progressInfo.progress,
      isFulfilled: progressInfo.isFulfilled,
    };
  }, [params.tipId, resolvedPlanCategory, trainingEntries, trainingPlanSettings]);

  const formatDate = (isoDate?: string) => formatDateValue(isoDate, i18n.language);

  const relatedMetricLinks = React.useMemo(() => {
    if (!params.tipId) return [];
    return tipMetricLinks[params.tipId] ?? [];
  }, [params.tipId]);

  const selectedDateKey = React.useMemo(() => toDateKey(new Date()), []);
  const weekStartKey = React.useMemo(() => getWeekStartKeyForDate(new Date()), []);

  const targetProgressMap = React.useMemo(() => {
    if (!tip?.id || resolvedPlanCategory === 'training') {
      return new Map<string, TipTargetProgress>();
    }

    const summary = dailyNutritionSummaries[selectedDateKey];
    const meals = Array.isArray(summary?.meals) ? summary.meals : [];

    const dailyTracking: WeeklyTrackingSignals = {};
    meals.forEach(meal => {
      const mealSignals = extractWeeklyTrackingSignals(meal, undefined);
      Object.entries(mealSignals).forEach(([key, value]) => {
        mergeWeeklyTrackingSignal(dailyTracking, key, value);
      });
    });

    const weekEndDate = new Date(weekStartKey);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEndKey = toDateKey(weekEndDate);

    const weeklySummaries = Object.entries(dailyNutritionSummaries)
      .filter(([dateKey]) => dateKey >= weekStartKey && dateKey <= weekEndKey)
      .map(([, daySummary]) => daySummary);

    const weeklyMeals = weeklySummaries.flatMap(daySummary =>
      Array.isArray(daySummary?.meals) ? daySummary.meals : []
    );

    const weeklyFiberTotal = weeklySummaries.reduce((sum, daySummary) => {
      const dayFiber = parseNumberValue(daySummary?.totals?.fiber) ?? 0;
      return sum + dayFiber;
    }, 0);

    const planProgress = buildNutritionPlanTipProgress({
      plans: {
        ...plans,
        nutrition: (plans.nutrition ?? []).filter(planEntry => planEntry.tipId === tip.id),
      },
      summary,
      t,
      selectedDateKey,
      weekStartKey,
      dailyTracking,
      weeklyTracking,
      takenDates,
      dailyFiberByType: sumTypedTotals(meals, 'fiberByType'),
      dailyPolyphenolByType: sumTypedTotals(meals, 'polyphenolByType'),
      dailyMineralsByType: sumTypedTotals(meals, 'mineralsByType'),
      dailyVitaminsByType: sumTypedTotals(meals, 'vitaminsByType'),
      dailyAminoAcidsByType: sumTypedTotals(meals, 'aminoAcidsByType'),
      weeklyFiberByType: sumTypedTotals(weeklyMeals, 'fiberByType'),
      weeklyPolyphenolByType: sumTypedTotals(weeklyMeals, 'polyphenolByType'),
      weeklyMineralsByType: sumTypedTotals(weeklyMeals, 'mineralsByType'),
      weeklyVitaminsByType: sumTypedTotals(weeklyMeals, 'vitaminsByType'),
      weeklyAminoAcidsByType: sumTypedTotals(weeklyMeals, 'aminoAcidsByType'),
      weeklyFiberTotal,
    });

    const tipProgress = planProgress.find(item => item.tipId === tip.id);
    const map = new Map<string, TipTargetProgress>();

    (tipProgress?.targets ?? []).forEach(target => {
      const targetKey = `${target.tag}|${target.unit}|${target.period}`;
      map.set(targetKey, {
        tag: target.tag,
        unit: target.unit,
        period: target.period,
        actual: target.actual,
        foodActual: target.foodActual,
        supplementActual: target.supplementActual,
        isMet: target.isMet,
        trackedItems: target.trackedItems,
        supplementIds: target.supplementIds,
      });
    });

    return map;
  }, [dailyNutritionSummaries, plans, resolvedPlanCategory, selectedDateKey, takenDates, t, tip?.id, weekStartKey, weeklyTracking]);

  const shouldShowTrainingTargetsUnset =
    resolvedPlanCategory === 'training' &&
    !targets.length &&
    !cardData?.badges?.length &&
    !trainingWeeklyProgress;

  const hasNutritionCardDetails = Boolean(
    cardData?.badges?.length || cardData?.recommendedDoseLabel || cardData?.foodItems?.length || cardData?.supplementNames?.length
  );

  return (
    <Container background="default" showBackButton onBackPress={() => router.back()}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <PlanCategoryIcon category={resolvedPlanCategory} size={60} />
          <View style={styles.titleContent}>
            <ThemedText type="title" style={styles.titleText}>
              {title}
            </ThemedText>
            <ThemedText type="caption" style={[styles.categoryLabel, { color: colors.primary }]} uppercase>
              {categoryLabel}
            </ThemedText>
            {Boolean(params.startedAt) && (
              <ThemedText type="explainer" style={styles.metaText}>
                {t('planMeta.activeSince', { date: formatDate(params.startedAt) })}
                {params.createdBy
                  ? ` • ${t('planMeta.createdBy', {
                      name: params.createdBy === 'you' ? t('general.you') : params.createdBy,
                    })}`
                  : ''}
              </ThemedText>
            )}
          </View>
        </View>
        <AppBox
          title={t('plan.whyImportantTitle')}
          headerRight={
            <PencilEditButton
              onPress={() => setIsEditingComment(true)}
              accessibilityLabel={t('plan.editComment')}
            />
          }
        >
          {isEditingComment ? (
            <TextInput
              value={commentDraft}
              onChangeText={setCommentDraft}
              multiline
              autoFocus
              style={[styles.commentInput, { color: colors.text, borderColor: colors.border }]}
              onBlur={() => {
                setIsEditingComment(false);
                if (!params.tipId || !params.planCategory) return;
                const category = params.planCategory as 'training' | 'nutrition' | 'other';
                setPlans(prev => ({
                  ...prev,
                  [category]: prev[category].map((entry: { tipId: string }) =>
                    entry.tipId === params.tipId
                      ? { ...entry, comment: commentDraft, editedAt: new Date().toISOString(), editedBy: 'you' }
                      : entry
                  ),
                }));
              }}
            />
          ) : (
            <ThemedText type="default" style={styles.commentText}>
              {commentDraft || t('plan.noComment')}
            </ThemedText>
          )}
        </AppBox>



        {resolvedPlanCategory === 'training' && (
          <AppBox
            title={t('plan.trainingTargetsTitle')}
            leading={<IconSymbol name="target" size={18} color={colors.primary} />}
          >
            {!!cardData?.badges?.length && (
              <View style={styles.badgeRow}>
                {cardData.badges.map(badge => (
                  <Badge key={`${badge.label}-${badge.icon ?? 'default'}`} variant="overlay" style={styles.inlineBadge}>
                    {badge.icon ? (
                      <IconSymbol name={badge.icon as React.ComponentProps<typeof IconSymbol>['name']} size={14} color={colors.icon} style={styles.badgeIcon} />
                    ) : null}
                    <ThemedText type="caption">{badge.label}</ThemedText>
                  </Badge>
                ))}
              </View>
            )}

            {trainingWeeklyProgress && (
              <View style={styles.trainingProgressContainer}>
                <ThemedText type="caption" style={styles.trainingProgressWeekLabel}>
                  {t('plan.trainingTargetsWeekLabel', {
                    weekStart: trainingWeeklyProgress.weekStartKey,
                    weekEnd: trainingWeeklyProgress.weekEndKey,
                  })}
                </ThemedText>
                <ThemedText type="caption" style={styles.trainingProgressStatus}>
                  {t('plan.trainingWeeklyProgress', {
                    actual: trainingWeeklyProgress.actual,
                    target: trainingWeeklyProgress.target,
                  })}
                </ThemedText>
                <View style={[styles.progressTrack, { backgroundColor: colors.secondaryBackground }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.round(trainingWeeklyProgress.progress * 100)}%`,
                        backgroundColor: trainingWeeklyProgress.isFulfilled ? colors.accentMedium : colors.icon,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {!!targets.length && (
              <>
                <ThemedText type="explainer" style={styles.targetInfoText}>
                  {targetProgressInfoText}
                </ThemedText>
                <View style={styles.targetList}>
                  {targets.map(target => (
                    (() => {
                      const progressTarget = targetProgressMap.get(`${target.tag}|${target.unit}|${target.period}`);

                      return (
                    <TipTarget
                      key={target.key}
                      tip={{ tipId: tip?.id ?? '', title: title, dateKey: selectedDateKey }}
                      target={{
                        tag: target.tag,
                        unit: target.unit,
                        period: target.period,
                        amount: target.amount,
                        actual: progressTarget?.actual ?? 0,
                        foodActual: progressTarget?.foodActual,
                        supplementActual: progressTarget?.supplementActual,
                        isMet: progressTarget?.isMet ?? false,
                        label: target.label,
                        trackedItems: progressTarget?.trackedItems,
                        supplementIds: progressTarget?.supplementIds,
                      }}
                      colors={{
                        primary: colors.primary,
                        textMuted: colors.textMuted,
                        overlayLight: colors.overlayLight,
                      }}
                    />
                      );
                    })()
                  ))}
                </View>
              </>
            )}

            {shouldShowTrainingTargetsUnset && (
              <ThemedText type="default" style={styles.commentText}>
                {t('plan.trainingTargetsUnset')}
              </ThemedText>
            )}
          </AppBox>
        )}

        {resolvedPlanCategory !== 'training' && !!targets.length && (
          <AppBox
            title={t('plan.targetsTitle')}
            leading={<IconSymbol name="target" size={18} color={colors.primary} />}
          >
            <ThemedText type="explainer" style={styles.targetInfoText}>
              {targetProgressInfoText}
            </ThemedText>
            <View style={styles.targetList}>
              {targets.map(target => (
                (() => {
                  const progressTarget = targetProgressMap.get(`${target.tag}|${target.unit}|${target.period}`);

                  return (
                <TipTarget
                  key={target.key}
                  tip={{ tipId: tip?.id ?? '', title: title, dateKey: selectedDateKey }}
                  target={{
                    tag: target.tag,
                    unit: target.unit,
                    period: target.period,
                    amount: target.amount,
                    actual: progressTarget?.actual ?? 0,
                    foodActual: progressTarget?.foodActual,
                    supplementActual: progressTarget?.supplementActual,
                    isMet: progressTarget?.isMet ?? false,
                    label: target.label,
                    trackedItems: progressTarget?.trackedItems,
                    supplementIds: progressTarget?.supplementIds,
                  }}
                  colors={{
                    primary: colors.primary,
                    textMuted: colors.textMuted,
                    overlayLight: colors.overlayLight,
                  }}
                />
                  );
                })()
              ))}
            </View>
          </AppBox>
        )}

        {!!relatedMetricLinks.length && (
          <AppBox
            title={t('plan.relatedMetricsTitle')}
            leading={<IconSymbol name="chart" size={18} color={colors.primary} />}
          >
            <View style={styles.relatedMetricsList}>
              {relatedMetricLinks.map(link => {
                const metric = metrics[link.metricId];
                if (!metric) return null;

                return (
                  <TouchableOpacity
                    key={link.metricId}
                    onPress={() => {
                      if (!params.tipId) return;

                      router.push({
                        pathname: '/(stack)/plan/[tipId]/metric/[metricId]',
                        params: { tipId: params.tipId, metricId: link.metricId },
                      });
                    }}
                    activeOpacity={0.8}
                    style={[styles.relatedMetricItem, { borderColor: colors.borderLight, backgroundColor: colors.cardBackground }]}
                  >
                    <View style={styles.relatedMetricItemText}>
                      <ThemedText type="defaultSemiBold">{t(`metrics:${link.metricId}.name`)}</ThemedText>
                      <ThemedText type="caption" style={styles.relatedMetricKind}>
                        {t(`metrics:kinds.${link.kind}`, { defaultValue: link.kind })}
                      </ThemedText>
                    </View>
                    <IconSymbol name="chevron.right" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </AppBox>
        )}

        {tip && (
          <PressableCard
            onPress={() => {
              const areaId = tip.areas[0]?.id;
              if (!areaId) return;
              router.push({
                pathname: `/dashboard/area/${areaId}/details` as any,
                params: { tipId: tip.id },
              });
            }}
            style={[styles.tipCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          >
            <View style={styles.tipCardRow}>
              <View style={styles.tipCardText}>
                <View style={styles.tipCardTitleRow}>
                  <IconSymbol name="lightbulb" size={18} color={colors.primary} />
                  <ThemedText type="title3" uppercase style={{ color: colors.primary }}>
                    {t('plan.tipInformation')}
                  </ThemedText>
                </View>
                <ThemedText type="default" style={styles.descriptionText} numberOfLines={3}>
                  {descriptionText}
                </ThemedText>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.icon} />
            </View>

        {resolvedPlanCategory === 'nutrition' && hasNutritionCardDetails && (
          <View style={[styles.recommendedContent, { borderTopColor: colors.borderLight }]}> 
            <ThemedText type="title3" style={styles.sectionTitle} uppercase>
              {t('plan.cardDetails')}
            </ThemedText>
            {!!cardData?.badges?.length && (
              <View style={styles.badgeRow}>
                {cardData.badges.map(badge => (
                  <Badge key={`${badge.label}-${badge.icon ?? 'default'}`} variant="overlay" style={styles.inlineBadge}>
                    {badge.icon ? (
                      <IconSymbol name={badge.icon as React.ComponentProps<typeof IconSymbol>['name']} size={14} color={colors.icon} style={styles.badgeIcon} />
                    ) : null}
                    <ThemedText type="caption">{badge.label}</ThemedText>
                  </Badge>
                ))}
              </View>
            )}
            {!!cardData?.recommendedDoseLabel && (
              <ThemedText type="default" style={styles.detailText}>
                {cardData.recommendedDoseLabel}
              </ThemedText>
            )}
            {!!cardData?.supplementNames?.length && (
              <View style={styles.listContainer}>
                {cardData.supplementNames.map(name => (
                  <ThemedText key={name} type="default" style={styles.detailText}>
                    • {name}
                  </ThemedText>
                ))}
              </View>
            )}
            {!!cardData?.foodItems?.length && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodItemScrollContent}>
                {cardData.foodItems.map(item => {
                  const foodImage = item.imageKey
                    ? (FOOD_IMAGES[item.imageKey as keyof typeof FOOD_IMAGES] as ImageSourcePropType | undefined)
                    : undefined;
                  const resolvedName = item.foodKey
                    ? t(`tips:${tip?.id}.nutritionFoods.items.${item.foodKey}.name`, {
                        defaultValue: t(`food:foods.${item.foodKey}.name`, {
                          defaultValue: item.name || item.foodKey,
                        }),
                      })
                    : item.name;
                  const resolvedDetails = item.detailsKey
                    ? t(`tips:${tip?.id}.nutritionFoods.items.${item.detailsKey}.details`, {
                        defaultValue: item.details ?? '',
                      })
                    : item.details;

                  return (
                    <Card key={`${item.name}-${item.details ?? 'default'}`} style={styles.foodItemCard}>
                      {foodImage ? <Image source={foodImage} style={styles.foodItemImage} /> : null}
                      <View style={styles.foodItemTextBlock}>
                        <ThemedText type="defaultSemiBold" numberOfLines={2}>
                          {resolvedName}
                        </ThemedText>
                        {resolvedDetails ? (
                          <ThemedText type="caption" style={styles.badgeDetail} numberOfLines={3}>
                            {resolvedDetails}
                          </ThemedText>
                        ) : null}
                      </View>
                    </Card>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
          </PressableCard>
        )}
      </View>
      <MetricsBottomSheet
        bottomSheetRef={metricsBottomSheetRef}
        tipId={params.tipId ?? null}
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleContent: {
    flex: 1,
    gap: 0,
  },
  titleText: {
    flex: 1,
  },
  categoryLabel: {
    marginTop: -6,
  },
  metaText: {
    marginTop: 1,
    marginBottom: 2,
  },
  commentText: {
    marginTop: 6,
    lineHeight: 20,
  },
  commentInput: {
    marginTop: 6,
    lineHeight: 20,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
  },
  descriptionText: {
    lineHeight: 22,
    marginTop: 4,
  },
  tipCard: {
    marginBottom: 0,
  },
  tipCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipCardText: {
    flex: 1,
  },
  tipCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  recommendedContent: {
    marginTop: 18,
    gap: 6,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  inlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  foodItemScrollContent: {
    gap: 10,
    paddingVertical: 2,
  },
  foodItemCard: {
    width: 140,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 6,
    marginBottom: 0,
  },
  foodItemImage: {
    width: 84,
    height: 84,
    borderRadius: 8,
    alignSelf: 'center',
  },
  foodItemTextBlock: {
    gap: 2,
    width: '100%',
  },
  badgeIcon: {
    marginRight: 2,
  },
  detailText: {
    marginTop: 8,
    lineHeight: 20,
  },
  badgeDetail: {
    marginTop: 2,
    opacity: 0.75,
  },
  listContainer: {
    marginTop: 4,
  },
  targetInfoText: {
    marginBottom: 8,
    opacity: 0.8,
  },
  trainingProgressContainer: {
    marginTop: 10,
    marginBottom: 8,
    gap: 4,
  },
  trainingProgressWeekLabel: {
    opacity: 0.8,
  },
  trainingProgressStatus: {
    opacity: 0.85,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sectionTitle: {
    marginTop: 12,
  },
  targetList: {
    gap: 6,
  },
  relatedMetricsList: {
    gap: 8,
  },
  relatedMetricItem: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  relatedMetricItemText: {
    flex: 1,
  },
  relatedMetricKind: {
    marginTop: 2,
    opacity: 0.75,
    textTransform: 'capitalize',
  },
});
