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
import { NutritionPlanDetailsSection } from '@/components/sections/plan/NutritionPlanDetailsSection';
import { PlanActionsBottomSheet } from '@/components/sections/plan/PlanActionsBottomSheet';
import { TrainingPlanDetailsSection } from '@/components/sections/plan/TrainingPlanDetailsSection';
import { ThemedText } from '@/components/ThemedText';
import { type TipTargetProgress } from '@/components/TipTarget';
import AppBox from '@/components/ui/AppBox';
import AppButton from '@/components/ui/AppButton';
import Badge from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import { IconSymbol } from '@/components/ui/IconSymbol';
import PencilEditButton from '@/components/ui/PencilEditButton';
import { PressableCard } from '@/components/ui/PressableCard';
import { FOOD_IMAGES } from '@/locales/foodCatalog';
import { metrics, tipMetricLinks } from '@/locales/metrics';
import { tips } from '@/locales/tips';
import { extractWeeklyTrackingSignals, mergeWeeklyTrackingSignal, parseNumberValue, type WeeklyTrackingSignals } from '@/utils/analyzeNutrition';
import { formatDate, toDateKey } from '@/utils/dateUtils';

type PlanDetailsParams = {
  tipId?: string;
  planId?: string;
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

type DeletablePlanCategory = 'training' | 'nutrition' | 'other';

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
  const { archivePlan, plans, dailyNutritionSummaries, weeklyTracking, takenDates, setPlans, setTrainingPlanSettings } = useStorage();
  const metricsBottomSheetRef = React.useRef<BottomSheet>(null);
  const planActionsBottomSheetRef = React.useRef<BottomSheet>(null);

  const [isEditingComment, setIsEditingComment] = React.useState(false);
  const [commentDraft, setCommentDraft] = React.useState(params.comment ?? '');
  const [isPlanActionsSheetMounted, setIsPlanActionsSheetMounted] = React.useState(false);

  const planTipId = React.useMemo(
    () => (typeof params.tipId === 'string' ? params.tipId : undefined),
    [params.tipId]
  );

  const tip = React.useMemo(() => {
    if (!params.tipId) return undefined;
    return tips.find(candidate => candidate.id === params.tipId);
  }, [params.tipId]);

  const title = params.title || (tip ? t(`tips:${tip.id}.title`) : t('plan.untitled'));
  const descriptionText = tip ? t(`tips:${tip.descriptionKey}`) : t('plan.noTipDetails');

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

  const hasNutritionCardDetails = Boolean(
    cardData?.badges?.length || cardData?.recommendedDoseLabel || cardData?.foodItems?.length || cardData?.supplementNames?.length
  );

  const canDeletePlan =
    Boolean(planTipId) &&
    (resolvedPlanCategory === 'training' || resolvedPlanCategory === 'nutrition' || resolvedPlanCategory === 'other');

  const planActionSnapPoints = React.useMemo(() => ['44%'], []);

  const closePlanActionsSheet = React.useCallback(() => {
    planActionsBottomSheetRef.current?.close();
  }, []);

  const openPlanActionsSheet = React.useCallback(() => {
    setIsPlanActionsSheetMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isPlanActionsSheetMounted) return;

    const frame = requestAnimationFrame(() => {
      planActionsBottomSheetRef.current?.expand();
    });

    return () => cancelAnimationFrame(frame);
  }, [isPlanActionsSheetMounted]);

  const handleArchivePlan = React.useCallback(() => {
    const tipId = planTipId;
    if (!tipId || !canDeletePlan) {
      closePlanActionsSheet();
      return;
    }

    const category = resolvedPlanCategory as DeletablePlanCategory;
    archivePlan(category, typeof params.planId === 'string' ? params.planId : undefined, tipId);
    closePlanActionsSheet();
    router.back();
  }, [archivePlan, canDeletePlan, closePlanActionsSheet, params.planId, planTipId, resolvedPlanCategory, router]);

  const handleDeletePlanPermanently = React.useCallback(() => {
    const tipId = planTipId;
    if (!tipId || !canDeletePlan) {
      closePlanActionsSheet();
      return;
    }

    const category = resolvedPlanCategory as DeletablePlanCategory;
    setPlans(prev => ({
      ...prev,
      [category]: prev[category].filter(entry =>
        params.planId ? entry.id !== params.planId : entry.tipId !== tipId
      ),
    }));

    if (category === 'training') {
      setTrainingPlanSettings(prev => {
        const next = { ...prev };
        delete next[tipId];
        return next;
      });
    }

    closePlanActionsSheet();
    router.back();
  }, [canDeletePlan, closePlanActionsSheet, params.planId, planTipId, resolvedPlanCategory, router, setPlans, setTrainingPlanSettings]);

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
                {t('planMeta.activeSince', { date: formatDate(params.startedAt, i18n.language) })}
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
                const category = params.planCategory as DeletablePlanCategory;
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
          <TrainingPlanDetailsSection
            cardData={cardData}
            tipId={tip?.id}
          />
        )}

        {resolvedPlanCategory !== 'training' && tip && (
          <NutritionPlanDetailsSection
            tip={tip}
            targetProgressMap={targetProgressMap}
            selectedDateKey={selectedDateKey}
            title={title}
          />
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

        {canDeletePlan && (
          <View style={styles.deletePlanWrap}>
            <AppButton
              title="Avsluta / Ta bort planen"
              variant="danger"
              onPress={openPlanActionsSheet}
            />
          </View>
        )}
      </View>

      {isPlanActionsSheetMounted && (
        <PlanActionsBottomSheet
          bottomSheetRef={planActionsBottomSheetRef}
          snapPoints={planActionSnapPoints}
          onArchivePlan={handleArchivePlan}
          onDeletePlan={handleDeletePlanPermanently}
          onCancel={closePlanActionsSheet}
        />
      )}

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
  sectionTitle: {
    marginTop: 12,
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
  deletePlanWrap: {
    marginTop: 8,
  },
});
